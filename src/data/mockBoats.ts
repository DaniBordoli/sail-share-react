import boat1 from "@/assets/boats/boat-1.jpg";
import boat2 from "@/assets/boats/boat-2.jpg";
import boat3 from "@/assets/boats/boat-3.jpg";
import boat4 from "@/assets/boats/boat-4.jpg";
import boat5 from "@/assets/boats/boat-5.jpg";
import boat6 from "@/assets/boats/boat-6.jpeg";
import boat7 from "@/assets/boats/boat-7.jpg";
import heroImage from "@/assets/hero-yacht.jpg";

const imgs = [boat1, boat2, boat3, boat4, boat5, boat6, boat7, heroImage];

export const mockBoats = [
  {
    id: 1,
    name: "Velero Aurora",
    location: "Ibiza, España",
    city: "Ibiza",
    country: "España",
    price: 320,
    rating: 4.8,
    capacity: 8,
    imageUrl: imgs[0],
    type: "Velero"
  },
  {
    id: 2,
    name: "Catamarán Brisa",
    location: "Mallorca, España",
    city: "Palma",
    country: "España",
    price: 450,
    rating: 4.6,
    capacity: 10,
    imageUrl: imgs[1],
    type: "Catamarán"
  },
  {
    id: 3,
    name: "Yate Boreal",
    location: "Marbella, España",
    city: "Marbella",
    country: "España",
    price: 980,
    rating: 4.9,
    capacity: 12,
    imageUrl: imgs[2],
    type: "Yate"
  },
  {
    id: 4,
    name: "Lancha Coral",
    location: "Barcelona, España",
    city: "Barcelona",
    country: "España",
    price: 220,
    rating: 4.4,
    capacity: 6,
    imageUrl: imgs[3],
    type: "Lancha"
  },
  {
    id: 5,
    name: "Goleta Delfín",
    location: "Alicante, España",
    city: "Alicante",
    country: "España",
    price: 540,
    rating: 4.7,
    capacity: 16,
    imageUrl: imgs[4],
    type: "Goleta"
  },
  {
    id: 6,
    name: "Velero Estrella",
    location: "Tenerife, España",
    city: "Santa Cruz",
    country: "España",
    price: 300,
    rating: 4.5,
    capacity: 8,
    imageUrl: imgs[5 % imgs.length],
    type: "Velero"
  },
  {
    id: 7,
    name: "Catamarán Faro",
    location: "Menorca, España",
    city: "Mahón",
    country: "España",
    price: 480,
    rating: 4.6,
    capacity: 12,
    imageUrl: imgs[6 % imgs.length],
    type: "Catamarán"
  },
  {
    id: 8,
    name: "Yate Galerna",
    location: "Ibiza, España",
    city: "Ibiza",
    country: "España",
    price: 1100,
    rating: 5.0,
    capacity: 14,
    imageUrl: imgs[7 % imgs.length],
    type: "Yate"
  },
  {
    id: 9,
    name: "Lancha Horizonte",
    location: "Valencia, España",
    city: "Valencia",
    country: "España",
    price: 210,
    rating: 4.3,
    capacity: 6,
    imageUrl: imgs[8 % imgs.length],
    type: "Lancha"
  },
  {
    id: 10,
    name: "Goleta Ícaro",
    location: "Málaga, España",
    city: "Málaga",
    country: "España",
    price: 560,
    rating: 4.7,
    capacity: 18,
    imageUrl: imgs[9 % imgs.length],
    type: "Goleta"
  },
  {
    id: 11,
    name: "Velero Júpiter",
    location: "Sitges, España",
    city: "Sitges",
    country: "España",
    price: 340,
    rating: 4.5,
    capacity: 9,
    imageUrl: imgs[10 % imgs.length],
    type: "Velero"
  },
  {
    id: 12,
    name: "Catamarán Koral",
    location: "Gran Canaria, España",
    city: "Las Palmas",
    country: "España",
    price: 500,
    rating: 4.6,
    capacity: 10,
    imageUrl: imgs[11 % imgs.length],
    type: "Catamarán"
  },
  {
    id: 13,
    name: "Yate Levante",
    location: "Formentera, España",
    city: "La Savina",
    country: "España",
    price: 1200,
    rating: 4.9,
    capacity: 12,
    imageUrl: imgs[12 % imgs.length],
    type: "Yate"
  },
  {
    id: 14,
    name: "Lancha Marea",
    location: "A Coruña, España",
    city: "A Coruña",
    country: "España",
    price: 190,
    rating: 4.2,
    capacity: 5,
    imageUrl: imgs[13 % imgs.length],
    type: "Lancha"
  },
  {
    id: 15,
    name: "Goleta Nereida",
    location: "Cádiz, España",
    city: "Cádiz",
    country: "España",
    price: 600,
    rating: 4.8,
    capacity: 20,
    imageUrl: imgs[14 % imgs.length],
    type: "Goleta"
  },
  {
    id: 16,
    name: "Velero Oceanis",
    location: "Santander, España",
    city: "Santander",
    country: "España",
    price: 360,
    rating: 4.5,
    capacity: 8,
    imageUrl: imgs[15 % imgs.length],
    type: "Velero"
  },
  {
    id: 17,
    name: "Catamarán Poseidón",
    location: "Denia, España",
    city: "Denia",
    country: "España",
    price: 520,
    rating: 4.6,
    capacity: 12,
    imageUrl: imgs[16 % imgs.length],
    type: "Catamarán"
  },
  {
    id: 18,
    name: "Yate Quimera",
    location: "Ibiza, España",
    city: "Ibiza",
    country: "España",
    price: 1300,
    rating: 5.0,
    capacity: 14,
    imageUrl: imgs[17 % imgs.length],
    type: "Yate"
  },
  {
    id: 19,
    name: "Lancha Rayo",
    location: "Valencia, España",
    city: "Valencia",
    country: "España",
    price: 200,
    rating: 4.1,
    capacity: 6,
    imageUrl: imgs[18 % imgs.length],
    type: "Lancha"
  },
  {
    id: 20,
    name: "Goleta Sirena",
    location: "Barcelona, España",
    city: "Barcelona",
    country: "España",
    price: 620,
    rating: 4.7,
    capacity: 18,
    imageUrl: imgs[19 % imgs.length],
    type: "Goleta"
  }
];
