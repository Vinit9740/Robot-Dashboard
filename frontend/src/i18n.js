import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "app_name": "Nexus Fleet Control",
            "login_title": "Nexus Systems Authorization",
            "login_subtitle": "Secure access to robotic fleet operations",
            "email_label": "Operator Email",
            "password_label": "Authorization Key",
            "login_btn": "Authorize Access",
            "logging_in": "Authenticating...",
            "home": "Home",
            "robots": "Robots",
            "tracker": "Tracker",
            "profile": "Profile",
            "logout": "Decommission",
            "online": "Online",
            "offline": "Offline",
            "total": "Total",
            "standby": "Standby",
            "tracking": "Tracking",
            "battery": "Battery",
            "temp": "Temp",
            "mission_planner": "Mission Planner",
            "select_map": "Select map",
            "edit_route": "Edit Route",
            "drawing": "Drawing",
            "clear": "Clear",
            "save_route": "Save Route",
            "new_route": "New Route",
            "start_mission": "Start Mission",
            "stop_mission": "Stop Mission",
            "saved_routes": "Saved Routes",
            "robot": "Robot",
            "route_name": "Route Name",
            "mission_active": "Mission Active",
            "fleet_live_status": "Fleet Live Status",
            "establish_connection": "Establishing secure connection...",
            "register_new_operative": "Register New Operative",
            "processing": "Processing...",
            "initialize_signup": "Initialize Signup →",
            "select_robot": "Select robot",
            "personnel_clearance": "Personnel Clearance",
            "verify": "Clearance"
        }
    },
    hi: {
        translation: {
            "app_name": "नेक्सस फ्लीट कंट्रोल",
            "login_title": "नेक्सस सिस्टम्स प्राधिकरण",
            "login_subtitle": "रोबोटिक बेड़े के संचालन तक सुरक्षित पहुंच",
            "email_label": "ऑपरेटर ईमेल",
            "password_label": "प्राधिकरण कुंजी",
            "login_btn": "पहुंच अधिकृत करें",
            "logging_in": "प्रमाणित किया जा रहा है...",
            "home": "होम",
            "robots": "रोबोट",
            "tracker": "ट्रैकर",
            "profile": "प्रोफ़ाइल",
            "logout": "लॉग आउट",
            "online": "ऑनलाइन",
            "offline": "ऑफलाइन",
            "total": "कुल",
            "standby": "स्टैंडबाय",
            "tracking": "ट्रैकिंग",
            "battery": "बैटरी",
            "temp": "तापमान",
            "mission_planner": "मिशन प्लानर",
            "select_map": "नक्शा चुनें",
            "edit_route": "मार्ग संपादित करें",
            "drawing": "ड्राइंग",
            "clear": "साफ करें",
            "save_route": "मार्ग सहेजें",
            "new_route": "नया मार्ग",
            "start_mission": "मिशन शुरू करें",
            "stop_mission": "मिशन रोकें",
            "saved_routes": "सहेजे गए मार्ग",
            "robot": "रोबोट",
            "route_name": "मार्ग का नाम",
            "mission_active": "मिशन सक्रिय",
            "fleet_live_status": "फ्लीट लाइव स्थिति",
            "establish_connection": "सुरक्षित कनेक्शन स्थापित किया जा रहा है...",
            "register_new_operative": "नया ऑपरेटर पंजीकृत करें",
            "processing": "प्रसंस्करण...",
            "initialize_signup": "साइनअप शुरू करें →",
            "select_robot": "रोबोट चुनें",
            "personnel_clearance": "कर्मी निकासी",
            "verify": "निकासी"
        }
    },
    kn: {
        translation: {
            "app_name": "ನೆಕ್ಸಸ್ ಫ್ಲೀಟ್ ನಿಯಂತ್ರಣ",
            "login_title": "ನೆಕ್ಸಸ್ ಸಿಸ್ಟಮ್ಸ್ ದೃಢೀಕರಣ",
            "login_subtitle": "ರೊಬೊಟಿಕ್ ಫ್ಲೀಟ್ ಕಾರ್ಯಾಚರಣೆಗಳಿಗೆ ಸುರಕ್ಷಿತ ಪ್ರವೇಶ",
            "email_label": "ಆಪರೇಟರ್ ಇಮೇಲ್",
            "password_label": "ದೃಢೀಕರಣ ಕೀ",
            "login_btn": "ಪ್ರವೇಶ ದೃಢೀಕರಿಸಿ",
            "logging_in": "ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
            "home": "ಮುಖಪುಟ",
            "robots": "ರೋಬೋಟ್‌ಗಳು",
            "tracker": "ಟ್ರಾಕರ್",
            "profile": "ಪ್ರೊಫೈಲ್",
            "logout": "ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ",
            "online": "ಆನ್‌ಲೈನ್",
            "offline": "ಆಫ್‌ಲೈನ್",
            "total": "ಒಟ್ಟು",
            "standby": "ಸ್ಟ್ಯಾಂಡ್‌ಬೈ",
            "tracking": "ಟ್ರ್ಯಾಕಿಂಗ್",
            "battery": "ಬ್ಯಾಟರಿ",
            "temp": "ತಾಪಮಾನ",
            "mission_planner": "ಮಿಷನ್ ಪ್ಲಾನರ್",
            "select_map": "ನಕ್ಷೆ ಆಯ್ಕೆಮಾಡಿ",
            "edit_route": "ಮಾರ್ಗ ಸಂಪಾದಿಸಿ",
            "drawing": "ಚಿತ್ರಿಸುವುದು",
            "clear": "ತೆರವುಗೊಳಿಸಿ",
            "save_route": "ಮಾರ್ಗ ಉಳಿಸಿ",
            "new_route": "ಹೊಸ ಮಾರ್ಗ",
            "start_mission": "ಮಿಷನ್ ಪ್ರಾರಂಭಿಸಿ",
            "stop_mission": "ಮಿಷನ್ ನಿಲ್ಲಿಸಿ",
            "saved_routes": "ಉಳಿಸಿದ ಮಾರ್ಗಗಳು",
            "robot": "ರೋಬೋಟ್",
            "route_name": "ಮಾರ್ಗದ ಹೆಸರು",
            "mission_active": "ಮಿಷನ್ ಸಕ್ರಿಯವಾಗಿದೆ",
            "fleet_live_status": "ಫ್ಲೀಟ್ ಲೈವ್ ಸ್ಥಿತಿ",
            "establish_connection": "ಸುರಕ್ಷಿತ ಸಂಪರ್ಕವನ್ನು ಸ್ಥಾಪಿಸಲಾಗುತ್ತಿದೆ...",
            "register_new_operative": "ಹೊಸ ಆಪರೇಟರ್ ಅನ್ನು ನೋಂದಾಯಿಸಿ",
            "processing": "ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
            "initialize_signup": "ಸೈನ್ ಅಪ್ ಪ್ರಾರಂಭಿಸಿ →",
            "select_robot": "ರೋಬೋಟ್ ಆಯ್ಕೆಮಾಡಿ",
            "personnel_clearance": "ಸಿಬ್ಬಂದಿ ಅನುಮತಿ",
            "verify": "ಅನುಮತಿ"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
