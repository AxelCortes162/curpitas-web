import React, { useState } from 'react';
import { Camera, Loader2, Save, Trash2, CheckCircle2, Plus, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export const PerroAdopcionCard = ({ dog, onUpdated, onDeleted }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: dog.name || '',
    species: dog.species || 'perro',
    breed: dog.breed || '',
    age_text: dog.age_text || '',
    description: dog.description || '',
    photo_urls: dog.photo_urls?.length ? dog.photo_urls : dog.photo_url ? [dog.photo_url] : [],
    city: dog.city || '',
    status: dog.status || 'disponible',
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const MAX_FOTOS = 3;

  // Sube una o varias fotos a la vez y las agrega a la lista, sin pasar de 3
  const handleFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    if (archivos.length === 0) return;

    const espacioDisponible = MAX_FOTOS - form.photo_urls.length;
    const archivosAUsar = archivos.slice(0, espacioDisponible);

    setSubiendoFoto(true);
    const nuevasUrls = [];

    for (const archivo of archivosAUsar) {
      if (archivo.size > 5 * 1024 * 1024) continue; // se salta las de más de 5MB
      const extension = archivo.name.split('.').pop();
      const ruta = `${user.id}/adopcion-${dog.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
      const { error } = await supabase.storage.from('pet-photos').upload(ruta, archivo, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('pet-photos').getPublicUrl(ruta);
        nuevasUrls.push(data.publicUrl);
      }
    }

    setForm((prev) => ({ ...prev, photo_urls: [...prev.photo_urls, ...nuevasUrls] }));
    setSubiendoFoto(false);
    e.target.value = '';
  };

  const quitarFoto = (index) => {
    setForm((prev) => ({ ...prev, photo_urls: prev.photo_urls.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('adoptable_dogs')
      .update({ ...form, photo_url: form.photo_urls[0] || null })
      .eq('id', dog.id);
    setSaving(false);
    setSavedMsg(error ? 'Error al guardar' : 'Guardado ✓');
    if (!error) onUpdated?.();
  };

  const handleDelete = async () => {
    await supabase.from('adoptable_dogs').delete().eq('id', dog.id);
    onDeleted?.(dog.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 space-y-3">
      <input
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Nombre del perro"
        className="w-full font-black text-[#1C5253] bg-transparent border-b border-emerald-100 pb-1 text-sm"
      />
      {form.status === 'adoptado' && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#88D49E]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Adoptado
        </span>
      )}

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">
          Fotos ({form.photo_urls.length}/{MAX_FOTOS})
        </p>
        <div className="flex flex-wrap gap-2">
          {form.photo_urls.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-100 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => quitarFoto(i)}
                className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {form.photo_urls.length < MAX_FOTOS && (
            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-200 flex items-center justify-center cursor-pointer hover:bg-emerald-50 shrink-0">
              {subiendoFoto ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#1C5253]" />
              ) : (
                <Plus className="w-5 h-5 text-[#1C5253]/50" />
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotos}
                disabled={subiendoFoto}
                className="hidden"
              />
            </label>
          )}
        </div>
        {form.photo_urls.length >= MAX_FOTOS && (
          <p className="text-[10px] text-gray-400 mt-1">Máximo {MAX_FOTOS} fotos — quita alguna para agregar otra.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.species}
          onChange={(e) => handleChange('species', e.target.value)}
          className="py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
        >
          <option value="perro">🐶 Perro</option>
          <option value="gato">🐱 Gato</option>
          <option value="otro">✨ Otro</option>
        </select>
        <input
          value={form.breed}
          onChange={(e) => handleChange('breed', e.target.value)}
          placeholder="Raza (opcional)"
          className="py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
        />
        <input
          value={form.age_text}
          onChange={(e) => handleChange('age_text', e.target.value)}
          placeholder="Edad (ej. 2 años)"
          className="py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
        />
        <input
          value={form.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="Colonia / Zona"
          className="py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
        />
      </div>

      <textarea
        value={form.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Cuéntale a la gente sobre su personalidad, salud, si es bueno con niños, etc."
        rows={3}
        className="w-full py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
      />

      <label className="flex items-center justify-between text-xs font-bold text-gray-600">
        Ya fue adoptado
        <input
          type="checkbox"
          checked={form.status === 'adoptado'}
          onChange={(e) => handleChange('status', e.target.checked ? 'adoptado' : 'disponible')}
          className="w-4 h-4 accent-[#88D49E]"
        />
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs disabled:opacity-60"
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
      {savedMsg && <p className="text-center text-[11px] text-emerald-700">{savedMsg}</p>}

      <div className="border-t border-emerald-100 pt-3">
        {!confirmandoEliminar ? (
          <button
            onClick={() => setConfirmandoEliminar(true)}
            className="w-full py-2 text-[11px] font-bold text-red-500 hover:underline flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar publicación
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmandoEliminar(false)}
              className="flex-1 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg"
            >
              Sí, eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerroAdopcionCard;