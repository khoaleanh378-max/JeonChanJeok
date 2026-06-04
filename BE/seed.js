const mongoose = require("mongoose");
require("dotenv").config();

const Book = require("./models/Book");

const books = [
  {
    book_id: "B_010",
    title: "Harry Potter and the Philosopher's Stone",
    category: "Fantasy",
    author: "J.K. Rowling",
    stock: 50,
    price: 150000,
    description: "The first Harry Potter novel.",
    image: ""
  },
  {
    book_id: "B_011",
    title: "The Hobbit",
    category: "Fantasy",
    author: "J.R.R. Tolkien",
    stock: 75,
    price: 180000,
    description: "Bilbo Baggins' adventure.",
    image: ""
  },
  {
    book_id: "B_012",
    title: "1984",
    category: "Dystopian",
    author: "George Orwell",
    stock: 40,
    price: 120000,
    description: "A dystopian classic.",
    image: ""
  },
  {
    book_id: "B_013",
    title: "Animal Farm",
    category: "Political Satire",
    author: "George Orwell",
    stock: 30,
    price: 90000,
    description: "A political allegory.",
    image: ""
  },
  {
    book_id: "B_014",
    title: "The Alchemist",
    category: "Fiction",
    author: "Paulo Coelho",
    stock: 60,
    price: 110000,
    description: "A journey of self-discovery.",
    image: ""
  },
  {
    book_id: "B_015",
    title: "Attack on Titan Vol. 1",
    category: "Manga",
    author: "Hajime Isayama",
    stock: 100,
    price: 85000,
    description: "The beginning of humanity's struggle.",
    image: ""
  },
  {
    book_id: "B_016",
    title: "One Piece Vol. 1",
    category: "Manga",
    author: "Eiichiro Oda",
    stock: 120,
    price: 90000,
    description: "Luffy begins his journey.",
    image: ""
  },
  {
    book_id: "B_017",
    title: "Naruto Vol. 1",
    category: "Manga",
    author: "Masashi Kishimoto",
    stock: 95,
    price: 85000,
    description: "The story of Naruto Uzumaki.",
    image: ""
  },
  {
    book_id: "B_018",
    title: "Solo Leveling Vol. 1",
    category: "Manhwa",
    author: "Chugong",
    stock: 70,
    price: 135000,
    description: "The weakest hunter becomes strongest.",
    image: ""
  },
  {
    book_id: "B_019",
    title: "The Pragmatic Programmer",
    category: "Technology",
    author: "Andrew Hunt",
    stock: 25,
    price: 350000,
    description: "Classic software development book.",
    image: ""
  },
  {
    book_id: "B_020",
    title: "Clean Code",
    category: "Technology",
    author: "Robert C. Martin",
    stock: 30,
    price: 320000,
    description: "Guide to writing clean code.",
    image: ""
  },
  {
    book_id: "B_021",
    title: "Deep Work",
    category: "Self Help",
    author: "Cal Newport",
    stock: 45,
    price: 175000,
    description: "Focus in a distracted world.",
    image: ""
  },
  {
    book_id: "B_022",
    title: "Atomic Habits",
    category: "Self Help",
    author: "James Clear",
    stock: 65,
    price: 210000,
    description: "Build better habits.",
    image: ""
  },
  {
    book_id: "B_023",
    title: "Rich Dad Poor Dad",
    category: "Finance",
    author: "Robert Kiyosaki",
    stock: 55,
    price: 145000,
    description: "Financial education book.",
    image: ""
  },
  {
    book_id: "B_024",
    title: "The Psychology of Money",
    category: "Finance",
    author: "Morgan Housel",
    stock: 35,
    price: 190000,
    description: "How people think about money.",
    image: ""
  },
  {
    book_id: "B_025",
    title: "Dune",
    category: "Science Fiction",
    author: "Frank Herbert",
    stock: 28,
    price: 220000,
    description: "Epic science fiction novel.",
    image: ""
  },
  {
    book_id: "B_026",
    title: "Foundation",
    category: "Science Fiction",
    author: "Isaac Asimov",
    stock: 33,
    price: 200000,
    description: "Classic sci-fi series.",
    image: ""
  },
  {
    book_id: "B_027",
    title: "The Silent Patient",
    category: "Thriller",
    author: "Alex Michaelides",
    stock: 42,
    price: 170000,
    description: "Psychological thriller.",
    image: ""
  },
  {
    book_id: "B_028",
    title: "The Da Vinci Code",
    category: "Mystery",
    author: "Dan Brown",
    stock: 38,
    price: 165000,
    description: "Mystery thriller novel.",
    image: ""
  },
  {
    book_id: "B_029",
    title: "Percy Jackson: The Lightning Thief",
    category: "Fantasy",
    author: "Rick Riordan",
    stock: 80,
    price: 155000,
    description: "Greek mythology adventure.",
    image: ""
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    await Book.deleteMany({});
    console.log("Old books deleted");

    await Book.insertMany(books);
    console.log(`${books.length} books inserted`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();