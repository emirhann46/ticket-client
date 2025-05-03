export type User = {
  _id: string; // MongoDB ObjectId string
  username: string;
  email: string;
  role: "user" | "organizer" | "admin";
  firstName?: string;
  lastName?: string;
  avatar?: string;
  profileImage?: string;
  firebaseUid?: string;
  isFirebaseUser?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tickets?: Ticket[];
};

export type Organizer = {
  _id: string; // MongoDB ObjectId string
  companyName: string;
  taxNumber: string;
  description: string;
  logo?: string; // Sadece url string
  approved: boolean;
  userId: string | User;
  events?: Event[];
};

export type Event = {
  _id: string; // MongoDB ObjectId string
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  availableTickets: number;
  coverImage?: string; // Ana resim
  sliderImages?: string[]; // Slider resimleri (array)
  image?: string; // Legacy support için
  category: {
    _id: string;
    name: string;
  };
  organizerId: {
    _id: string;
    username: string;
    email: string;
  };
  isApproved: boolean;
  createdAt?: string;
  tickets?: Ticket[];
};

export type Category = {
  _id: string; // MongoDB ObjectId string
  name: string;
  description?: string;
  image?: string;
  createdAt?: string;
};

export type Ticket = {
  _id: string; // MongoDB ObjectId string
  userId: string | User;
  eventId: string | Event;
  purchaseDate: string;
  price: number;
  isPaid: boolean;
  qrCode?: string;
  isUsed: boolean;
  status: "pending" | "confirmed" | "cancelled";
};

export type Payment = {
  _id: string; // MongoDB ObjectId string
  paymentCode: string;
  amount: number;
  paymentMethod: "credit_card" | "paypal" | "bank_transfer";
  status: "pending" | "completed" | "failed";
  transactionId: string;
  userId: string | User;
  tickets: string[] | Ticket[];
  createdAt?: string;
};

// Sepet işlemleri için gerekli tipler
export type CartItem = {
  eventId: string;
  event: Event;
  quantity: number;
};

// Ödeme işlemleri için gerekli tipler
export type PaymentForm = {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvc: string;
  amount: number;
};

export type CheckoutSession = {
  id: string;
  url: string;
  status: string;
};
