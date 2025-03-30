"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, Clock } from 'lucide-react';

interface EventFormData {
  title: string;
  description: string;
  date: Date | undefined;
  location: string;
  imageLinks: string[];
  price: string;
  capacity: string;
  category: string;
}

const AdminDashboard = () => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: undefined,
    location: '',
    imageLinks: [''],
    price: '',
    capacity: '',
    category: ''
  });
  const [time, setTime] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addImageLink = () => {
    setFormData(prev => ({
      ...prev,
      imageLinks: [...prev.imageLinks, '']
    }));
  }

  const removeImageLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageLinks: prev.imageLinks.filter((_, i) => i !== index)
    }));
  }

  const handleImageLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.imageLinks];
    newLinks[index] = value;
    setFormData(prev => ({
      ...prev,
      imageLinks: newLinks
    }));
  }

  const handleDateSelect = (selectedDate: Date) => {
    if (selectedDate) {
      const currentDate = formData.date || new Date();
      selectedDate.setHours(currentDate.getHours());
      selectedDate.setMinutes(currentDate.getMinutes());
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
      setShowCalendar(false);
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);

    if (formData.date) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(formData.date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setFormData(prev => ({
        ...prev,
        date: newDate
      }));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Etkinlik Verileri:', formData);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Yeni Etkinlik Ekle</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Başlık */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Başlığı
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Açıklaması
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                required
              />
            </div>

            {/* Tarih ve Saat */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Tarihi ve Saati
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-left flex items-center"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PPP', { locale: tr }) : "Tarih seçiniz"}
                  </button>
                  {showCalendar && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="p-4">
                        <div className="grid grid-cols-7 gap-1">
                          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500">
                              {day}
                            </div>
                          ))}
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const date = new Date();
                                date.setDate(day);
                                handleDateSelect(date);
                              }}
                              className="p-2 text-sm rounded-full hover:bg-gray-100"
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="300"
                    required
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Lokasyon */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Lokasyonu
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Resim Linkleri */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Görselleri
              </label>
              <div className="space-y-3">
                {formData.imageLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => handleImageLinkChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Görsel linkini giriniz"
                      required={index === 0}
                    />
                    {formData.imageLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageLink(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageLink}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Görsel Ekle
                </button>
              </div>
            </div>

            {/* Fiyat */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Fiyatı
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                min="0"
              />
            </div>

            {/* Kapasite */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Kapasitesi
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                min="1"
              />
            </div>

            {/* Kategori Seçimi */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etkinlik Kategorisi
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Kategori seçiniz</option>
                <option value="konser">Konser</option>
                <option value="tiyatro">Tiyatro</option>
                <option value="festival">Festival</option>
                <option value="workshop">Workshop</option>
                <option value="seminer">Seminer</option>
              </select>
            </div>

            {/* Kaydet Butonu */}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Etkinlik Oluştur
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
