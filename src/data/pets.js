// Catálogo de mascotas.
// Por ahora es un array escrito a mano, pero está pensado para que en el futuro
// esta misma función (getPetByCurpita) simplemente haga un fetch a tu base de datos
// en vez de buscar dentro de este array.

export const pets = [
  {
    name: "MAYA",
    curpita: "CURPITA80233025",
    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600",
    birthDate: "23/08/2023",
    breed: "Golden Retriever",
    owner: "Alejandro Cortés",
    phone: "+52 55 1234 5678",
    city: "CDMX, México",
    medicalInfo: "Alérgica a la penicilina. Requiere medicación diaria.",
    isLost: true,
  },
  {
    name: "ROCKY",
    curpita: "CURPITA19204471",
    photo: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=600",
    birthDate: "10/02/2021",
    breed: "Bulldog Francés",
    owner: "Camila Ruiz",
    phone: "+52 55 9876 5432",
    city: "Guadalajara, México",
    medicalInfo: "",
    isLost: false,
  },
  {
    name: "LUNA",
    curpita: "CURPITA55621809",
    photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=600",
    birthDate: "05/06/2022",
    breed: "Gato Siamés",
    owner: "Diego Fernández",
    phone: "+52 33 4455 6677",
    city: "Monterrey, México",
    medicalInfo: "Requiere dieta especial por problemas renales.",
    isLost: true,
  },
];

// Busca una mascota por su folio CURPITA.
// Devuelve undefined si no la encuentra (así la pantalla puede mostrar "no encontrada").
export const getPetByCurpita = (curpita) => {
  return pets.find((pet) => pet.curpita.toLowerCase() === curpita?.toLowerCase());
};