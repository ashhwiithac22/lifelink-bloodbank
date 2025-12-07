# 🩸 LifeLink – Blood Bank Management System, A MERN Stack WebApp

A **full-stack MERN (MongoDB, Express, React, Node.js)** web application designed to streamline the **blood donation and management process** between **donors, hospitals, and administrators**.  
This project enables hospitals to request blood, donors to contribute, and admins to manage the overall blood bank system efficiently.

---

## 🚀 Features

### 👤 Authentication & Role-Based Access
- Secure **Login / Register** for Donors, Hospitals, and Admins.  
- Role-based routing and dashboards for each user type.  

### 🩸 Donor Dashboard
- Donors can **donate blood**, view their donation history, and update their availability.  
- Displays donor’s **blood group, contact details, and status**.

### 🏥 Hospital Dashboard
- Hospitals can **create new blood requests** based on need.  
- View and search **available donors** by blood group and location.  
- Track all **requests (pending/approved)** in real-time.

### 🛠️ Admin Dashboard
- Manage **all users (Donors, Hospitals)** from a central system.  
- Monitor and approve/reject **blood requests** from hospitals.  
- View **inventory levels** and donor activity in real-time.  
- Auto-alerts when any blood type drops below a safe level.

### 📧 Email Notifications *(Future Enhancement)*
- Hospitals can send **automated email requests** to donors using **Nodemailer**.  
- Real-time status updates for requests and approvals.

### 📊 Statistics & Analytics
- Displays key statistics like:
  - Pending Requests
  - Available Units
  - Urgent Needs

---

## 🏗️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| Frontend | React.js, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT (JSON Web Tokens) |
| Hosting (Optional) | Render / Vercel / Netlify |



---

## ⚙️ Installation & Setup

### 🖥️ Clone Repository
```bash
git clone https://github.com/ashhwiithac22/lifelink-bloodbank.git
cd lifelink-bloodbank
```

### 📦 Install Dependencies
For backend:
```
cd backend
npm install
```

For frontend:
```
cd frontend
npm install
```

--- 

### 🔑 Add Environment Variables

Create a .env file in your backend/ folder and add:
```
MONGO_URI = your_mongodb_connection_string
JWT_SECRET = your_jwt_secret_key
PORT = 5000
EMAIL_USER=your_emailID_here
EMAIL_PASS=your_email_password_here
```
### ▶️ Run Application

In two separate terminals:

Backend:
- cd backend
- npm start

Frontend:
- cd frontend
- npm start

The app will run at http://localhost:3000

---

### 🧩 Key Functionalities Completed

- ✅ Login/Register pages
- ✅ Role-based dashboard (Donor, Hospital, Admin)
- ✅ Blood donation & request system
- ✅ Donor and hospital management
- ✅ MongoDB Atlas integration
- ✅ Inventory monitoring
- ✅ Automated email alerts using Nodemailer

🧠 Future Enhancements

- 🔹 Graph-based analytics using Chart.js or Recharts
- 🔹 Integration of Google Maps API for nearby donor search
- 🔹 Dark/light mode toggle for better UI


---
## 🌐 Live Demo & Deployment

You can explore the **LifeLink – Blood Bank Management System** live using the links below:

- **Frontend (React App)**: [https://lifelink-bloodbank.vercel.app/](https://lifelink-bloodbank.vercel.app/)  
- **Backend (Node.js + Express API)**: [https://lifelink-bloodbank.onrender.com/](https://lifelink-bloodbank-4gxu.onrender.com/)  

Feel free to interact with the dashboards, create blood requests, and explore donor/hospital/admin functionalities.

---

