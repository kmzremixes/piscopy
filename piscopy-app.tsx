import React, { useState, useRef } from 'react';
import { Camera, Upload, Edit3, Trash2, Download, Save, Printer, Plus, FileText, Image, Eye, X } from 'lucide-react';

const PiscopyApp = () => {
  const [currentView, setCurrentView] = useState('gallery'); // 'gallery' or 'documents'
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [currentDocument, setCurrentDocument] = useState(null);
  const [docType, setDocType] = useState('receipt');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Firebase configuration
  const FIREBASE_URL = 'https://piscopy-store-default-rtdb.asia-southeast1.firebasedatabase.app';

  // Load data from Firebase on component mount
  React.useEffect(() => {
    loadPhotosFromFirebase();
    loadDocumentsFromFirebase();
  }, []);

  // Firebase helper functions
  const loadPhotosFromFirebase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FIREBASE_URL}/photos.json`);
      const data = await response.json();
      if (data) {
        const photosArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setPhotos(photosArray);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePhotoToFirebase = async (photo) => {
    try {
      const response = await fetch(`${FIREBASE_URL}/photos.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photo)
      });
      const data = await response.json();
      return data.name; // Firebase returns the generated key
    } catch (error) {
      console.error('Error saving photo:', error);
      return null;
    }
  };

  const updatePhotoInFirebase = async (photoId, photo) => {
    try {
      await fetch(`${FIREBASE_URL}/photos/${photoId}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photo)
      });
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  const deletePhotoFromFirebase = async (photoId) => {
    try {
      await fetch(`${FIREBASE_URL}/photos/${photoId}.json`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const loadDocumentsFromFirebase = async () => {
    try {
      const response = await fetch(`${FIREBASE_URL}/documents.json`);
      const data = await response.json();
      if (data) {
        const documentsArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setDocuments(documentsArray);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const saveDocumentToFirebase = async (document) => {
    try {
      const response = await fetch(`${FIREBASE_URL}/documents.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document)
      });
      const data = await response.json();
      return data.name;
    } catch (error) {
      console.error('Error saving document:', error);
      return null;
    }
  };

  const updateDocumentInFirebase = async (docId, document) => {
    try {
      await fetch(`${FIREBASE_URL}/documents/${docId}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document)
      });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  // Shop information
  const shopInfo = {
    name: "ถ่ายเอกสารพิส",
    phone1: "043771476",
    phone2: "0639898917", 
    lineId: "0815921229",
    hours: "8:00-17:00",
    location: "ข้างธนาคารกสิกรไทย อำเภอบรบือ จังหวัดมหาสารคาม"
  };

  // Photo Gallery Functions
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newPendingFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      fileName: file.name,
      note: '',
      preview: null
    }));

    // Create preview for each file
    newPendingFiles.forEach(pendingFile => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPendingFiles(prev => prev.map(pf => 
          pf.id === pendingFile.id ? {...pf, preview: e.target.result} : pf
        ));
      };
      reader.readAsDataURL(pendingFile.file);
    });

    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    const newPendingFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      fileName: file.name,
      note: '',
      preview: null
    }));

    // Create preview for each file
    newPendingFiles.forEach(pendingFile => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPendingFiles(prev => prev.map(pf => 
          pf.id === pendingFile.id ? {...pf, preview: e.target.result} : pf
        ));
      };
      reader.readAsDataURL(pendingFile.file);
    });

    setPendingFiles(prev => [...prev, ...newPendingFiles]);
  };

  const updatePendingFileNote = (fileId, note) => {
    setPendingFiles(prev => prev.map(pf => 
      pf.id === fileId ? {...pf, note} : pf
    ));
  };

  const savePendingFile = async (fileId) => {
    const pendingFile = pendingFiles.find(pf => pf.id === fileId);
    if (pendingFile && pendingFile.preview) {
      setLoading(true);
      try {
        const newPhoto = {
          fileName: pendingFile.fileName,
          imageUrl: pendingFile.preview,
          note: pendingFile.note,
          uploadedAt: new Date().toISOString()
        };
        
        const firebaseId = await savePhotoToFirebase(newPhoto);
        if (firebaseId) {
          const photoWithId = { ...newPhoto, id: firebaseId };
          setPhotos(prev => [...prev, photoWithId]);
          setPendingFiles(prev => prev.filter(pf => pf.id !== fileId));
        }
      } catch (error) {
        console.error('Error saving photo:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ');
      } finally {
        setLoading(false);
      }
    }
  };

  const removePendingFile = (fileId) => {
    setPendingFiles(prev => prev.filter(pf => pf.id !== fileId));
  };

  const openPhoto = (photo) => {
    setSelectedPhoto(photo);
    setNoteText(photo.note);
    setEditingNote(false);
  };

  const saveNote = async () => {
    if (selectedPhoto) {
      setLoading(true);
      try {
        const updatedPhoto = { ...selectedPhoto, note: noteText };
        await updatePhotoInFirebase(selectedPhoto.id, updatedPhoto);
        
        setPhotos(prev => prev.map(photo => 
          photo.id === selectedPhoto.id ? updatedPhoto : photo
        ));
        setSelectedPhoto(updatedPhoto);
        setEditingNote(false);
      } catch (error) {
        console.error('Error updating note:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกบันทึก');
      } finally {
        setLoading(false);
      }
    }
  };

  const deletePhoto = async (photoId) => {
    if (window.confirm('คุณต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
      setLoading(true);
      try {
        await deletePhotoFromFirebase(photoId);
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
        setSelectedPhoto(null);
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = photo.fileName;
    link.click();
  };

  // Document Functions
  const createNewDocument = () => {
    const newDoc = {
      id: Date.now(),
      docType: docType,
      status: 'draft',
      content: getDefaultTemplate(docType),
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    setDocuments(prev => [...prev, newDoc]);
    setCurrentDocument(newDoc);
  };

  const getDefaultTemplate = (type) => {
    const baseTemplate = {
      companyName: 'บริษัทลูกค้า',
      date: new Date().toISOString().split('T')[0],
      items: [
        { description: 'ถ่ายเอกสาร A4', quantity: 100, price: 1.00 },
        { description: 'เข้าเล่มสันกาว', quantity: 1, price: 50.00 }
      ],
      total: 150.00
    };

    switch(type) {
      case 'receipt':
        return { ...baseTemplate, title: 'ใบเสร็จรับเงิน' };
      case 'delivery_note':
        return { ...baseTemplate, title: 'ใบส่งของ' };
      case 'purchase_order':
        return { ...baseTemplate, title: 'ใบสั่งซื้อ' };
      default:
        return baseTemplate;
    }
  };

  const saveDocument = () => {
    setDocuments(prev => prev.map(doc => 
      doc.id === currentDocument.id ? currentDocument : doc
    ));
    alert('บันทึกเอกสารเรียบร้อย');
  };

  const printDocument = () => {
    const updatedDoc = {
      ...currentDocument,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    setDocuments(prev => prev.map(doc => 
      doc.id === currentDocument.id ? updatedDoc : doc
    ));
    setCurrentDocument(updatedDoc);
    window.print();
  };

  const updateDocumentField = (field, value) => {
    setCurrentDocument(prev => ({
      ...prev,
      content: { ...prev.content, [field]: value }
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...currentDocument.content.items];
    newItems[index][field] = field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value;
    
    const total = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    setCurrentDocument(prev => ({
      ...prev,
      content: {
        ...prev.content,
        items: newItems,
        total: total
      }
    }));
  };

  const addItem = () => {
    const newItems = [...currentDocument.content.items, { description: '', quantity: 1, price: 0 }];
    setCurrentDocument(prev => ({
      ...prev,
      content: { ...prev.content, items: newItems }
    }));
  };

  const removeItem = (index) => {
    const newItems = currentDocument.content.items.filter((_, i) => i !== index);
    const total = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    setCurrentDocument(prev => ({
      ...prev,
      content: {
        ...prev.content,
        items: newItems,
        total: total
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Camera className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{shopInfo.name}</h1>
              <p className="text-sm opacity-90">
                ☎️ {shopInfo.phone1} | 📞 {shopInfo.phone2} | Line: {shopInfo.lineId}
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p>🕰️ เปิด {shopInfo.hours}</p>
            <p>📍 {shopInfo.location}</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex space-x-4">
          <button
            onClick={() => setCurrentView('gallery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              currentView === 'gallery' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Image className="h-5 w-5" />
            <span>แกลเลอรี่รูปภาพ</span>
          </button>
          <button
            onClick={() => setCurrentView('documents')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              currentView === 'documents' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>จัดการเอกสาร</span>
          </button>
        </div>
      </nav>

      {/* Photo Gallery View */}
      {currentView === 'gallery' && (
        <div className="max-w-6xl mx-auto p-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">อัปโหลดรูปภาพ</h2>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">ลากและวางไฟล์รูปภาพ หรือคลิกเพื่อเลือกไฟล์</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                เลือกไฟล์
              </button>
            </div>
          </div>

          {/* Pending Files Section */}
          {pendingFiles.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">ไฟล์ที่รอบันทึก ({pendingFiles.length})</h2>
              <div className="space-y-4">
                {pendingFiles.map(pendingFile => (
                  <div key={pendingFile.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        {pendingFile.preview ? (
                          <img
                            src={pendingFile.preview}
                            alt={pendingFile.fileName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Upload className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* File Info and Note */}
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900 mb-2">{pendingFile.fileName}</h3>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            บันทึกเกี่ยวกับไฟล์นี้:
                          </label>
                          <textarea
                            value={pendingFile.note}
                            onChange={(e) => updatePendingFileNote(pendingFile.id, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            rows="2"
                            placeholder="เขียนบันทึกเกี่ยวกับไฟล์นี้..."
                          />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => savePendingFile(pendingFile.id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                          >
                            <Save className="h-4 w-4" />
                            <span>บันทึก</span>
                          </button>
                          <button
                            onClick={() => removePendingFile(pendingFile.id)}
                            className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>ยกเลิก</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Grid */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">รูปภาพทั้งหมด ({photos.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="group relative">
                  <img
                    src={photo.imageUrl}
                    alt={photo.fileName}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => openPhoto(photo)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{photo.fileName}</p>
                </div>
              ))}
            </div>
            {photos.length === 0 && (
              <p className="text-gray-500 text-center py-8">ยังไม่มีรูปภาพ</p>
            )}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedPhoto.fileName}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.fileName}
                className="max-w-full max-h-96 mx-auto mb-4"
              />
              
              {/* Notes Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">บันทึก</h4>
                  <button
                    onClick={() => setEditingNote(!editingNote)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                {editingNote ? (
                  <div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full p-2 border rounded-lg mb-2"
                      rows="3"
                      placeholder="เขียนบันทึกเกี่ยวกับรูปนี้..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveNote}
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setEditingNote(false)}
                        className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-2 rounded">
                    {selectedPhoto.note || 'ไม่มีบันทึก'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadPhoto(selectedPhoto)}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>ดาวน์โหลด</span>
                  </button>
                </div>
                <button
                  onClick={() => deletePhoto(selectedPhoto.id)}
                  className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents View */}
      {currentView === 'documents' && (
        <div className="max-w-6xl mx-auto p-6">
          {!currentDocument ? (
            <div>
              {/* Document Controls */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">จัดการเอกสาร</h2>
                  <div className="flex items-center space-x-4">
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="receipt">ใบเสร็จรับเงิน</option>
                      <option value="delivery_note">ใบส่งของ</option>
                      <option value="purchase_order">ใบสั่งซื้อ</option>
                    </select>
                    <button
                      onClick={createNewDocument}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>สร้างเอกสารใหม่</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Lists */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Draft Documents */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">เอกสารฉบับร่าง</h3>
                  <div className="space-y-2">
                    {documents.filter(doc => doc.status === 'draft').map(doc => (
                      <div key={doc.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{doc.content.title}</p>
                          <p className="text-sm text-gray-600">{doc.content.companyName}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString('th-TH')}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentDocument(doc)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('ต้องการลบเอกสารนี้?')) {
                                setDocuments(prev => prev.filter(d => d.id !== doc.id));
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {documents.filter(doc => doc.status === 'draft').length === 0 && (
                      <p className="text-gray-500 text-center py-4">ไม่มีเอกสารฉบับร่าง</p>
                    )}
                  </div>
                </div>

                {/* Completed Documents */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">เอกสารที่เสร็จสิ้น</h3>
                  <div className="space-y-2">
                    {documents.filter(doc => doc.status === 'completed').map(doc => (
                      <div key={doc.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{doc.content.title}</p>
                          <p className="text-sm text-gray-600">{doc.content.companyName}</p>
                          <p className="text-xs text-gray-500">
                            เสร็จเมื่อ: {new Date(doc.completedAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentDocument(doc)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {documents.filter(doc => doc.status === 'completed').length === 0 && (
                      <p className="text-gray-500 text-center py-4">ไม่มีเอกสารที่เสร็จสิ้น</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Document Editor */
            <div className="bg-white rounded-lg shadow-md">
              {/* Document Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">{currentDocument.content.title}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentDocument(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    กลับ
                  </button>
                  {currentDocument.status === 'draft' && (
                    <>
                      <button
                        onClick={saveDocument}
                        className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                        <span>บันทึก</span>
                      </button>
                      <button
                        onClick={printDocument}
                        className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Printer className="h-4 w-4" />
                        <span>พิมพ์</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Document Content */}
              <div className="p-8 max-w-4xl mx-auto">
                {/* Shop Header */}
                <div className="text-center mb-8 pb-4 border-b-2">
                  <h1 className="text-2xl font-bold text-blue-700">{shopInfo.name}</h1>
                  <p className="text-sm mt-2">
                    {shopInfo.location}<br/>
                    โทร: {shopInfo.phone1}, {shopInfo.phone2} | Line: {shopInfo.lineId}<br/>
                    เปิด: {shopInfo.hours}
                  </p>
                </div>

                {/* Document Title */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{currentDocument.content.title}</h2>
                </div>

                {/* Document Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อลูกค้า/บริษัท:</label>
                    <input
                      type="text"
                      value={currentDocument.content.companyName}
                      onChange={(e) => updateDocumentField('companyName', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      disabled={currentDocument.status === 'completed'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">วันที่:</label>
                    <input
                      type="date"
                      value={currentDocument.content.date}
                      onChange={(e) => updateDocumentField('date', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      disabled={currentDocument.status === 'completed'}
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">รายการ</h3>
                    {currentDocument.status === 'draft' && (
                      <button
                        onClick={addItem}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        + เพิ่มรายการ
                      </button>
                    )}
                  </div>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">รายการ</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">จำนวน</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">ราคา/หน่วย</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">รวม</th>
                        {currentDocument.status === 'draft' && (
                          <th className="border border-gray-300 px-4 py-2 text-center">ลบ</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentDocument.content.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full border-0 bg-transparent"
                              disabled={currentDocument.status === 'completed'}
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-full border-0 bg-transparent text-center"
                              disabled={currentDocument.status === 'completed'}
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', e.target.value)}
                              className="w-full border-0 bg-transparent text-center"
                              disabled={currentDocument.status === 'completed'}
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            ฿{(item.quantity * item.price).toFixed(2)}
                          </td>
                          {currentDocument.status === 'draft' && (
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <button
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold">
                        <td className="border border-gray-300 px-4 py-2 text-right" colSpan={currentDocument.status === 'draft' ? 4 : 3}>
                          รวมทั้งสิ้น:
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          ฿{currentDocument.content.total.toFixed(2)}
                        </td>
                        {currentDocument.status === 'draft' && <td className="border border-gray-300"></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t">
                  <p>ขอบคุณที่ใช้บริการ {shopInfo.name}</p>
                  {currentDocument.status === 'completed' && (
                    <p className="mt-2">
                      พิมพ์เมื่อ: {new Date(currentDocument.completedAt).toLocaleString('th-TH')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PiscopyApp;