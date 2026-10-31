<div align="center">
  <img src="frontend/src/components/logo.png" alt="CyberNinjas Logo" width="140" />
  <img src="frontend/src/components/Cyber%20ninjas.svg" alt="CyberNinjas Text Logo" width="320" />
</div>

# CyberNinjas Education

**CyberNinjas** is an AI-powered inclusive learning platform designed to make digital education accessible for everyone, especially students with disabilities.

The platform provides assistive tools such as voice commands, text-to-speech, speech-to-text, captions, and adaptive learning modes to help students learn more easily.

## Features
*   **Student Assistive Tools**:
    *   Voice command control for navigation and accessibility features
    *   Text-to-Speech for students who cannot read text easily
    *   Speech-to-Text for voice input
    *   Assistive modes for different needs: Visual mode, Hearing mode, Motor mode, Cognitive mode
    *   Adjustable text size and High contrast mode
    *   Focus mode for distraction-free learning
    *   Captions support and Eye tracking support
    *   Talk to AI assistant for help and guidance
*   **Teacher Panel**: Dedicated dashboard for teachers to create lessons, manage quizzes, review student submissions, and track class progress.
*   **Admin Panel**: Centralized control panel for administrators to manage users (students and teachers) and oversee platform activities.
*   **Secure Authentication**: Safe login, signup, and password recovery.
*   **Interactive UI**: Clean, responsive, and mobile-friendly design.

## Tech Stack 🛠️

*   **Frontend**: React.js with Vite, Tailwind CSS for beautiful styling, Lucide React for icons.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose) for securely storing user and lesson data.
*   **AI Integration**: Google Generative AI (Gemini APIs) for smart learning features.

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ashishchaharkhorrdia/education.git
    cd education
    ```

2.  **Setup the Backend:**
    ```bash
    cd backend
    npm install
    
    # Create a .env file with the following variables:
    # PORT=5000
    # MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority&appName=Cluster0
    # JWT_SECRET=<your_jwt_secret>
    # GEMINI_API_KEY=<your_gemini_api_key>
    # FRONTEND_URL=https://equaled-ai.vercel.app
    # CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
    # CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    # CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    # BREVO_SMTP_KEY=<your_brevo_smtp_key>
    # BREVO_FROM_EMAIL=sachinacz15@gmail.com
    # BREVO_FROM_NAME=EqualEd
    
    npm run dev
    ```

3.  **Setup the Frontend (in a new terminal):**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Open the App:**
    Visit `http://localhost:5173` (or the URL shown in your terminal) to view EqualEd in your browser.

### Default Login Accounts

| Role        | Email (Username)            | Password             | Redirects To         |
| ----------- | --------------------------- | -------------------- | -------------------- |
| **Admin**   | `admin@equaled.com`         | `AdminPassword123`   | `/admin-dashboard`   |
| **Teacher** | `teacher@equaled.com`       | `TeacherPassword123` | `/teacher-dashboard` |
| **Student** | `achaharkhorrdia@gmail.com` | *(student password)* | `/dashboard`         |

> You can also create new Teacher or Admin accounts at any time via the Signup page (`/signup`) by choosing your desired role in the dropdown.

## Contributing 🤝
We welcome contributions! Feel free to open issues or submit pull requests to help make EqualEd even more accessible and better for everyone.

## License 📄
MIT License - free to use, modify, and distribute.# education
# education
# education
