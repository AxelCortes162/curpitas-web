import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const PetEditorCard = ({ pet, onUpdated }) => {
  const [form, setForm] = useState({
    name: pet.name || '',
    breed: pet.breed || '',
    birth_date: pet.birth_date || '',
    city: pet.city || '',
    photo_url: pet.photo_url || '',
    medical_info: pet.medical_info || '',
    is_lost: pet.is_lost,
    show_breed: pet.show_breed,
    show_birth_date: pet.show_birth_date,
    show_medical_info: pet.show_medical_info,
    show_owner_name: pet.show_owner_name,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');

    const { error } = await supabase
      .from('pets')
      .update(form)
      .eq('id', pet.id);

    setSaving(false);

    if (error) {
      setSavedMsg('Error al guardar: ' + error.message);
      return;
    }

    setSavedMsg('Guardado ✓');
    onUpdated?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-gray-400">{pet.curpita}</span>
        {form.is_lost ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
            <ShieldAlert className="w-3 h-3" /> Perdida
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#1C5253] uppercase">
            <CheckCircle2 className="w-3 h-3 text-[#88D49E]" /> A salvo
          </span>
        )}
      </div>

      {/* Campos editables */}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full mt-0.5 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Raza</label>
          <input
            value={form.breed}
            onChange={(e) => handleChange('breed', e.target.value)}
            className="w-full mt-0.5 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Nacimiento</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => handleChange('birth_date', e.target.value)}
            className="w-full mt-0.5 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Ciudad</label>
          <input
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full mt-0.5 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Foto (URL)</label>
          <input
            value={form.photo_url}
            onChange={(e) => handleChange('photo_url', e.target.value)}
            className="w-full mt-0.5 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Info médica</label>
          <textarea
            value={form.medical_info}
            onChange={(e) => handleChange('medical_info', e.target.value)}
            rows={2}
            className="w-full mt-0.5 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />
        </div>
      </div>

      {/* Estado perdida/a salvo */}
      <label className="flex items-center justify-between text-xs font-bold text-gray-600">
        Marcar como perdida
        <input
          type="checkbox"
          checked={form.is_lost}
          onChange={(e) => handleChange('is_lost', e.target.checked)}
          className="w-4 h-4 accent-red-500"
        />
      </label>

      {/* Interruptores de visibilidad */}
      <div className="border-t border-emerald-100 pt-2 space-y-1.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Qué se muestra en el perfil público
        </p>
        <label className="flex items-center justify-between text-xs text-gray-600">
          Raza
          <input
            type="checkbox"
            checked={form.show_breed}
            onChange={(e) => handleChange('show_breed', e.target.checked)}
            className="w-4 h-4 accent-[#88D49E]"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-gray-600">
          Fecha de nacimiento
          <input
            type="checkbox"
            checked={form.show_birth_date}
            onChange={(e) => handleChange('show_birth_date', e.target.checked)}
            className="w-4 h-4 accent-[#88D49E]"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-gray-600">
          Información médica
          <input
            type="checkbox"
            checked={form.show_medical_info}
            onChange={(e) => handleChange('show_medical_info', e.target.checked)}
            className="w-4 h-4 accent-[#88D49E]"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-gray-600">
          Nombre del tutor
          <input
            type="checkbox"
            checked={form.show_owner_name}
            onChange={(e) => handleChange('show_owner_name', e.target.checked)}
            className="w-4 h-4 accent-[#88D49E]"
          />
        </label>
        <p className="text-[10px] text-gray-400 italic">
          El teléfono siempre se muestra — no es opcional.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs disabled:opacity-60"
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      {savedMsg && <p className="text-center text-[11px] text-emerald-700">{savedMsg}</p>}
    </div>
  );
};

export default PetEditorCard;