const Z = {
  en: {
    navProfile: "My profile", navOwner: "Owner profile",
    verifyToRent: "To rent out a room, please verify your email first. You do not need this for searching rooms or calling owners.",
    verifyToReport: "To report a room, please verify your email first. You do not need this for searching rooms or calling owners.",
    verifySent: "We sent a verification email. Check Inbox and Spam.",
    pfPhotoLbl: "Profile photo (public, optional)", pfPhotoDel: "Remove photo",
    pfName: "Full name (public)", pfAbout: "About me (public)",
    pfBioPh: "Tell people who you are. Example: I am the owner of this house. I am not a broker. Do not write private details here.",
    pfCountry: "Country", pfNotSet: "Not set", pfIN: "India", pfNP: "Nepal",
    pfShowCountry: "Show my country on my public profile",
    pfEmail: "Email (private, never shown)", pfEmailOk: "✔ Email verified", pfEmailNo: "Email not verified",
    pfVerifyEmail: "Verify my email",
    pfPhone: "Phone number", pfPhoneOk: "✔ Verified by SMS code", pfPhoneNo: "Not verified",
    pvSend: "Verify this number with an SMS code", pvCodePh: "6 digit code", pvConfirm: "Confirm code",
    pvSent: "Code sent. Type the 6 digit code from the SMS.", pvDone: "Phone number verified ✔",
    pfSave: "Save profile", pfSaved: "Profile saved!", pfViewPublic: "View my public profile",
    pfMeta: "Member since {since} · My rooms: {rooms} · Favourites: {favs}",
    pfInfo: "People who open your public profile (from your rooms) can see: your name, photo and About me, your country (only if you tick the box), the date you joined, verified badges and your rooms. They never see your email, password, favourites, searches or your phone's location. Your phone number is shown only on rooms where you have not hidden it (Settings, Privacy).",
    pfNameShort: "Please enter your name (at least 2 letters).",
    pfRoomsPhoneFail: "Your profile was saved, but the number on your rooms could not be changed. Rooms approved with a verified number can only show that verified number. Verify the new number first.",
    ovRooms: "Rooms by this owner", ovNone: "No live rooms right now.",
    ovNoProfile: "This owner has not written a public profile yet.",
    ovSince: "Member since {d}", ovCountry: "Country: {c}",
    ovEmail: "✔ Email verified", ovPhone: "✔ Phone verified by SMS",
    ownerProfile: "Owner profile", ownerBy: "Posted by {name} · view profile", phoneVerifiedTag: "Phone verified",
    nudgeText: "Verify your phone number in your profile so your rooms can be approved instantly. Without it, an admin checks each room first, which takes longer.",
    nudgeBtn: "Verify my phone",
    needPhone: "Please verify your phone number in your profile before adding a room.",
    chkPhone: "Phone number not verified. Verify it in your profile for instant approval",
    chkPhoneOk: "Phone number verified by SMS code",
    phoneMismatch: "Note: the phone number on this room is not your verified number, so an admin will check it.",
    pvErrInvalid: "Enter a valid 10 digit phone number.",
    pvErrMany: "Too many tries. Please wait a while and try again.",
    pvErrQuota: "SMS limit reached for now. Please try again later.",
    pvErrNA: "Phone verification is not available right now. It needs phone sign-in turned on in Firebase and a billing account for SMS.",
    pvErrCode: "Wrong code. Please check and try again.",
    pvErrExpired: "This code has expired. Send a new code.",
    pvErrUsed: "This phone number is already used by another Vhuba account.",
    pvErrRecent: "Please logout and login again, then try once more.",
    pvErrCaptcha: "Security check failed. Please try again.",
    pvErrNet: "No internet. Please check your connection.",
    privTitle: "Privacy Policy and Terms",
    privText:
      "<p><b>Privacy Policy and Terms of Use</b></p>" +
      "<p>Last updated: 8 November 2026</p>" +
      "<p><b>Who we are.</b> Vhuba is a free app that helps people find and offer rooms for rent. We only connect room seekers and room owners. We are not a broker, we do not own or manage any room, and we are not part of any rental agreement.</p>" +
      "<p><b>Who can use it.</b> You must be 18 years or older.</p>" +
      "<p><b>What we collect and why.</b></p>" +
      "<p>• Name, email and phone number: to create and protect your account, and so that tenants can contact you.</p>" +
      "<p>• If you use Continue with Google, we receive your name and email from Google. We do not get your Google password.</p>" +
      "<p>• Country, profile photo and About me: optional, only if you add them.</p>" +
      "<p>• Language and dark mode choice, favourite rooms, saved search and last visit time: to make the app work the way you like.</p>" +
      "<p>• Room details you add (title, area, rent, deposit, charges, photos and, if you choose, a location pin): to show your room to others. Any logged-in user can see them.</p>" +
      "<p>• Your phone number is shown on your rooms unless you hide it in Settings. When it is shown, any logged-in user can call you or message you on WhatsApp.</p>" +
      "<p>• Phone verification: if you verify your phone number, a one-time SMS code is sent through Google Firebase and the verified number is linked to your account. It is used only to check that the number on your rooms is yours.</p>" +
      "<p>• Your phone location: only when you tap a location button, to pin a room or to sort rooms by distance. We do not track you in the background.</p>" +
      "<p>• Reports you send: to keep the app safe.</p>" +
      "<p><b>Your public profile.</b> If you rent out a room, logged-in users can open your public profile from your rooms. It shows only: your name, photo and About me (if you add them), your country (only if you tick the box), the date you joined, badges that show your email and phone are verified, and your rooms. Your email, password, favourites, searches and phone location are never shown. Do not write private details in About me.</p>" +
      "<p><b>Where data is stored.</b> Your data is stored with Google Firebase (servers may be outside your country). The app is hosted on GitHub Pages. The phone dialer, WhatsApp and Google Maps open outside Vhuba and have their own rules.</p>" +
      "<p><b>We do not sell your data</b> and we do not show ads.</p>" +
      "<p><b>Your choices and rights.</b> In your Profile and Settings you can change your name, phone number, photo, About me, country and password, and hide your phone number. You can withdraw your consent at any time and delete your account and all your rooms: Settings, Account, Delete account. To ask for a copy of your data, to correct it, or to make a complaint, write in Settings, Help and about, Report a problem. We will reply as soon as we can. You can also complain to the data protection authority in your country (in India, the Data Protection Board of India).</p>" +
      "<p><b>How long we keep data.</b> A room hides itself after 30 days unless the owner renews it. When you delete your account, your profile, public profile and rooms are removed. Records of fraud reports may be kept for safety.</p>" +
      "<p><b>Keeping data safe.</b> We use verified login and database rules so that people can change only their own data. No system is 100% safe.</p>" +
      "<p><b>Rules for using Vhuba.</b></p>" +
      "<p>• Add only real rooms that you own or are allowed to rent out. Choose 'Owner' or 'Broker' honestly.</p>" +
      "<p>• No fake rooms, wrong prices, hidden charges, stolen photos or scams. Never ask anyone to pay token or advance money before they have seen the room.</p>" +
      "<p>• At most 5 rooms per account.</p>" +
      "<p>• Be respectful, and do not misuse the report button.</p>" +
      "<p>• We may hide or delete rooms or accounts that break these rules, without notice.</p>" +
      "<p><b>Stay safe.</b> Vhuba does not check every room. A 'Verified owner' mark only means a Vhuba admin has checked that person in some way, and a 'Phone verified' mark only means the owner received an SMS code on that number. Neither is a guarantee. Before paying anything, always see the room and meet the owner in person. Do not send money online to someone you have not met. Rent, deposit and agreement are between you and the other person.</p>" +
      "<p><b>Limits of responsibility.</b> The app is provided 'as it is'. As far as the law allows, Vhuba is not responsible for losses between users, wrong information, or the app being unavailable.</p>" +
      "<p><b>Changes.</b> We may change this. Important changes will be shown in the app.</p>" +
      "<p><b>Contact.</b> Settings, Help and about.</p>"
  },
  hi: {
    navProfile: "मेरी प्रोफ़ाइल", navOwner: "मालिक की प्रोफ़ाइल",
    verifyToRent: "कमरा किराए पर देने के लिए पहले अपना ईमेल सत्यापित करें। कमरे खोजने या मालिकों को कॉल करने के लिए इसकी ज़रूरत नहीं है।",
    verifyToReport: "कमरे की रिपोर्ट करने के लिए पहले अपना ईमेल सत्यापित करें। कमरे खोजने या मालिकों को कॉल करने के लिए इसकी ज़रूरत नहीं है।",
    verifySent: "हमने सत्यापन ईमेल भेज दिया है। इनबॉक्स और स्पैम देखें।",
    pfPhotoLbl: "प्रोफ़ाइल फोटो (सार्वजनिक, वैकल्पिक)", pfPhotoDel: "फोटो हटाएं",
    pfName: "पूरा नाम (सार्वजनिक)", pfAbout: "मेरे बारे में (सार्वजनिक)",
    pfBioPh: "लोगों को बताएं कि आप कौन हैं। जैसे: मैं इस घर का मालिक हूँ। मैं ब्रोकर नहीं हूँ। यहाँ निजी जानकारी न लिखें।",
    pfCountry: "देश", pfNotSet: "चुना नहीं गया", pfIN: "भारत", pfNP: "नेपाल",
    pfShowCountry: "मेरी सार्वजनिक प्रोफ़ाइल पर मेरा देश दिखाएं",
    pfEmail: "ईमेल (निजी, कभी नहीं दिखता)", pfEmailOk: "✔ ईमेल सत्यापित", pfEmailNo: "ईमेल सत्यापित नहीं",
    pfVerifyEmail: "मेरा ईमेल सत्यापित करें",
    pfPhone: "फ़ोन नंबर", pfPhoneOk: "✔ SMS कोड से सत्यापित", pfPhoneNo: "सत्यापित नहीं",
    pvSend: "इस नंबर को SMS कोड से सत्यापित करें", pvCodePh: "6 अंकों का कोड", pvConfirm: "कोड की पुष्टि करें",
    pvSent: "कोड भेज दिया गया है। SMS में आया 6 अंकों का कोड डालें।", pvDone: "फ़ोन नंबर सत्यापित हो गया ✔",
    pfSave: "प्रोफ़ाइल सेव करें", pfSaved: "प्रोफ़ाइल सेव हो गई!", pfViewPublic: "मेरी सार्वजनिक प्रोफ़ाइल देखें",
    pfMeta: "सदस्य बने: {since} · मेरे कमरे: {rooms} · पसंदीदा: {favs}",
    pfInfo: "जो लोग (आपके कमरों से) आपकी सार्वजनिक प्रोफ़ाइल खोलते हैं, वे देख सकते हैं: आपका नाम, फोटो और मेरे बारे में, आपका देश (सिर्फ़ अगर आप बॉक्स टिक करें), जुड़ने की तारीख, सत्यापन के निशान और आपके कमरे। वे आपका ईमेल, पासवर्ड, पसंदीदा, खोजें या फ़ोन की लोकेशन कभी नहीं देखते। आपका फ़ोन नंबर सिर्फ़ उन कमरों पर दिखता है जहाँ आपने उसे छुपाया नहीं है (सेटिंग्स, गोपनीयता)।",
    pfNameShort: "कृपया अपना नाम लिखें (कम से कम 2 अक्षर)।",
    pfRoomsPhoneFail: "आपकी प्रोफ़ाइल सेव हो गई, पर आपके कमरों का नंबर नहीं बदल सका। सत्यापित नंबर से मंज़ूर हुए कमरे सिर्फ़ वही सत्यापित नंबर दिखा सकते हैं। पहले नया नंबर सत्यापित करें।",
    ovRooms: "इस मालिक के कमरे", ovNone: "अभी कोई उपलब्ध कमरा नहीं है।",
    ovNoProfile: "इस मालिक ने अभी सार्वजनिक प्रोफ़ाइल नहीं लिखी है।",
    ovSince: "सदस्य बने: {d}", ovCountry: "देश: {c}",
    ovEmail: "✔ ईमेल सत्यापित", ovPhone: "✔ फ़ोन SMS से सत्यापित",
    ownerProfile: "मालिक की प्रोफ़ाइल", ownerBy: "{name} ने डाला · प्रोफ़ाइल देखें", phoneVerifiedTag: "फ़ोन सत्यापित",
    nudgeText: "अपनी प्रोफ़ाइल में फ़ोन नंबर सत्यापित करें, ताकि आपके कमरे तुरंत मंज़ूर हो सकें। इसके बिना एडमिन हर कमरा पहले खुद जाँचता है, जिसमें ज़्यादा समय लगता है।",
    nudgeBtn: "मेरा फ़ोन सत्यापित करें",
    needPhone: "कमरा जोड़ने से पहले अपनी प्रोफ़ाइल में फ़ोन नंबर सत्यापित करें।",
    chkPhone: "फ़ोन नंबर सत्यापित नहीं। तुरंत मंज़ूरी के लिए प्रोफ़ाइल में सत्यापित करें",
    chkPhoneOk: "फ़ोन नंबर SMS कोड से सत्यापित",
    phoneMismatch: "ध्यान दें: इस कमरे पर लिखा फ़ोन नंबर आपका सत्यापित नंबर नहीं है, इसलिए एडमिन इसे जाँचेगा।",
    pvErrInvalid: "सही 10 अंकों का फ़ोन नंबर डालें।",
    pvErrMany: "बहुत ज़्यादा कोशिशें हो गईं। कुछ देर रुककर फिर कोशिश करें।",
    pvErrQuota: "अभी SMS की सीमा पूरी हो गई है। बाद में फिर कोशिश करें।",
    pvErrNA: "फ़ोन सत्यापन अभी उपलब्ध नहीं है। इसके लिए Firebase में फ़ोन साइन-इन चालू होना और SMS के लिए बिलिंग खाता चाहिए।",
    pvErrCode: "कोड गलत है। जाँचकर फिर कोशिश करें।",
    pvErrExpired: "इस कोड की समय सीमा खत्म हो गई। नया कोड भेजें।",
    pvErrUsed: "यह फ़ोन नंबर किसी दूसरे Vhuba खाते में पहले से इस्तेमाल हो रहा है।",
    pvErrRecent: "कृपया लॉगआउट करके दोबारा लॉगिन करें, फिर एक बार कोशिश करें।",
    pvErrCaptcha: "सुरक्षा जाँच फेल हो गई। फिर कोशिश करें।",
    pvErrNet: "इंटरनेट नहीं है। कनेक्शन जाँचें।",
    privTitle: "गोपनीयता नीति और शर्तें",
    privText:
      "<p><b>गोपनीयता नीति और उपयोग की शर्तें</b></p>" +
      "<p>आखिरी अपडेट: 8 नवंबर 2026</p>" +
      "<p><b>हम कौन हैं।</b> Vhuba एक मुफ़्त ऐप है जो किराए के कमरे खोजने और देने वालों को जोड़ता है। हम सिर्फ़ मिलाने का काम करते हैं। हम ब्रोकर नहीं हैं, किसी कमरे के मालिक या मैनेजर नहीं हैं, और किसी किराए के समझौते का हिस्सा नहीं हैं।</p>" +
      "<p><b>कौन इस्तेमाल कर सकता है।</b> आपकी उम्र 18 साल या उससे ज़्यादा होनी चाहिए।</p>" +
      "<p><b>हम क्या जानकारी लेते हैं और क्यों।</b></p>" +
      "<p>• नाम, ईमेल और फ़ोन नंबर: आपका खाता बनाने और सुरक्षित रखने के लिए, और ताकि किराएदार आपसे संपर्क कर सकें।</p>" +
      "<p>• अगर आप Google से जारी रखते हैं, तो हमें Google से आपका नाम और ईमेल मिलता है। हमें आपका Google पासवर्ड नहीं मिलता।</p>" +
      "<p>• देश, प्रोफ़ाइल फोटो और मेरे बारे में: वैकल्पिक, सिर्फ़ तब जब आप जोड़ें।</p>" +
      "<p>• भाषा और डार्क मोड की पसंद, पसंदीदा कमरे, सेव की हुई खोज और आखिरी बार देखने का समय: ऐप को आपकी पसंद के हिसाब से चलाने के लिए।</p>" +
      "<p>• आपके जोड़े हुए कमरे की जानकारी (नाम, एरिया, किराया, डिपॉज़िट, खर्चे, फोटो और अगर आप चाहें तो लोकेशन पिन): दूसरों को कमरा दिखाने के लिए। लॉगिन किया हुआ हर व्यक्ति इसे देख सकता है।</p>" +
      "<p>• आपका फ़ोन नंबर आपके कमरों पर दिखता है, जब तक आप उसे सेटिंग्स में छुपा न दें। दिखने पर लॉगिन किया हुआ कोई भी व्यक्ति आपको कॉल या WhatsApp कर सकता है।</p>" +
      "<p>• फ़ोन सत्यापन: अगर आप अपना फ़ोन नंबर सत्यापित करते हैं, तो Google Firebase के ज़रिए एक बार का SMS कोड भेजा जाता है और सत्यापित नंबर आपके खाते से जुड़ जाता है। इसका इस्तेमाल सिर्फ़ यह जाँचने के लिए होता है कि आपके कमरों पर लिखा नंबर आपका है।</p>" +
      "<p>• आपके फ़ोन की लोकेशन: सिर्फ़ तब जब आप लोकेशन का बटन दबाते हैं, कमरे पर पिन लगाने या पास के कमरे दिखाने के लिए। हम पीछे से आपको ट्रैक नहीं करते।</p>" +
      "<p>• आपकी भेजी हुई रिपोर्ट: ऐप को सुरक्षित रखने के लिए।</p>" +
      "<p><b>आपकी सार्वजनिक प्रोफ़ाइल।</b> अगर आप कमरा किराए पर देते हैं, तो लॉगिन किए हुए लोग आपके कमरों से आपकी सार्वजनिक प्रोफ़ाइल खोल सकते हैं। उसमें सिर्फ़ ये दिखता है: आपका नाम, फोटो और मेरे बारे में (अगर आप जोड़ें), आपका देश (सिर्फ़ अगर आप बॉक्स टिक करें), जुड़ने की तारीख, ईमेल और फ़ोन सत्यापित होने के निशान, और आपके कमरे। आपका ईमेल, पासवर्ड, पसंदीदा, खोजें और फ़ोन की लोकेशन कभी नहीं दिखती। मेरे बारे में में निजी जानकारी न लिखें।</p>" +
      "<p><b>डेटा कहाँ रहता है।</b> आपका डेटा Google Firebase पर रहता है (सर्वर आपके देश के बाहर भी हो सकते हैं)। ऐप GitHub Pages पर चलती है। फ़ोन डायलर, WhatsApp और Google Maps Vhuba के बाहर खुलते हैं और उन पर उनके अपने नियम लागू होते हैं।</p>" +
      "<p><b>हम आपका डेटा बेचते नहीं हैं</b> और कोई विज्ञापन नहीं दिखाते।</p>" +
      "<p><b>आपके अधिकार और विकल्प।</b> आप प्रोफ़ाइल और सेटिंग्स में नाम, फ़ोन नंबर, फोटो, मेरे बारे में, देश और पासवर्ड बदल सकते हैं और अपना फ़ोन नंबर छुपा सकते हैं। आप कभी भी अपनी सहमति वापस ले सकते हैं और अपना खाता और अपने सारे कमरे हटा सकते हैं: सेटिंग्स, खाता, खाता हटाएं। अपने डेटा की कॉपी माँगने, उसमें सुधार करवाने या शिकायत करने के लिए सेटिंग्स, मदद और जानकारी, समस्या बताएं में लिखें। हम जल्द से जल्द जवाब देंगे। आप अपने देश के डेटा सुरक्षा प्राधिकरण से भी शिकायत कर सकते हैं (भारत में डेटा प्रोटेक्शन बोर्ड ऑफ इंडिया)।</p>" +
      "<p><b>डेटा कितने समय रखते हैं।</b> कमरा 30 दिन बाद अपने आप छुप जाता है, जब तक मालिक उसे नवीनीकृत न करे। खाता हटाने पर आपकी प्रोफ़ाइल, सार्वजनिक प्रोफ़ाइल और आपके कमरे हट जाते हैं। धोखाधड़ी की रिपोर्ट के रिकॉर्ड सुरक्षा के लिए रखे जा सकते हैं।</p>" +
      "<p><b>डेटा की सुरक्षा।</b> हम सत्यापित लॉगिन और डेटाबेस के नियम इस्तेमाल करते हैं, ताकि लोग सिर्फ़ अपना ही डेटा बदल सकें। कोई भी सिस्टम 100% सुरक्षित नहीं होता।</p>" +
      "<p><b>इस्तेमाल के नियम।</b></p>" +
      "<p>• सिर्फ़ असली कमरे जोड़ें जिनके आप मालिक हैं या जिन्हें किराए पर देने का आपको हक़ है। 'मालिक' या 'ब्रोकर' ईमानदारी से चुनें।</p>" +
      "<p>• फर्जी कमरे, गलत किराया, छुपे हुए खर्चे, चोरी की फोटो या धोखाधड़ी नहीं। कमरा देखे बिना किसी से टोकन या एडवांस पैसे न माँगें।</p>" +
      "<p>• एक खाते से ज़्यादा से ज़्यादा 5 कमरे।</p>" +
      "<p>• सम्मान से पेश आएं और रिपोर्ट के बटन का गलत इस्तेमाल न करें।</p>" +
      "<p>• जो इन नियमों को तोड़े, उसके कमरे या खाते हम बिना बताए छुपा या हटा सकते हैं।</p>" +
      "<p><b>सुरक्षित रहें।</b> Vhuba हर कमरे की जाँच नहीं करता। 'सत्यापित मालिक' का निशान सिर्फ़ यह बताता है कि Vhuba एडमिन ने उस व्यक्ति को किसी तरह जाँचा है, और 'फ़ोन सत्यापित' का निशान सिर्फ़ यह कि मालिक को उस नंबर पर SMS कोड मिला। इनमें से कोई भी गारंटी नहीं है। कुछ भी पैसा देने से पहले हमेशा कमरा देखें और मालिक से खुद मिलें। जिससे आप मिले नहीं हैं, उसे ऑनलाइन पैसे न भेजें। किराया, डिपॉज़िट और समझौता आपके और दूसरे व्यक्ति के बीच की बात है।</p>" +
      "<p><b>ज़िम्मेदारी की सीमा।</b> ऐप 'जैसी है वैसी' दी जाती है। कानून जितनी इजाज़त देता है, उतने में, Vhuba उपयोगकर्ताओं के बीच हुए नुकसान, गलत जानकारी या ऐप के बंद रहने के लिए ज़िम्मेदार नहीं है।</p>" +
      "<p><b>बदलाव।</b> हम इसे बदल सकते हैं। बड़े बदलाव ऐप में दिखाए जाएंगे।</p>" +
      "<p><b>संपर्क।</b> सेटिंग्स, मदद और जानकारी।</p>"
  },
  ne: {
    navProfile: "मेरो प्रोफाइल", navOwner: "मालिकको प्रोफाइल",
    verifyToRent: "कोठा भाडामा दिन पहिले आफ्नो इमेल प्रमाणित गर्नुहोस्। कोठा खोज्न वा मालिकलाई फोन गर्न यो आवश्यक छैन।",
    verifyToReport: "कोठाको रिपोर्ट गर्न पहिले आफ्नो इमेल प्रमाणित गर्नुहोस्। कोठा खोज्न वा मालिकलाई फोन गर्न यो आवश्यक छैन।",
    verifySent: "हामीले प्रमाणीकरण इमेल पठाएका छौं। इनबक्स र स्प्याम हेर्नुहोस्।",
    pfPhotoLbl: "प्रोफाइल फोटो (सार्वजनिक, ऐच्छिक)", pfPhotoDel: "फोटो हटाउनुहोस्",
    pfName: "पूरा नाम (सार्वजनिक)", pfAbout: "मेरो बारेमा (सार्वजनिक)",
    pfBioPh: "मानिसहरूलाई आफू को हुँ भनेर बताउनुहोस्। जस्तै: म यो घरको मालिक हुँ। म ब्रोकर होइन। यहाँ निजी जानकारी नलेख्नुहोस्।",
    pfCountry: "देश", pfNotSet: "छानिएको छैन", pfIN: "भारत", pfNP: "नेपाल",
    pfShowCountry: "मेरो सार्वजनिक प्रोफाइलमा मेरो देश देखाउनुहोस्",
    pfEmail: "इमेल (निजी, कहिल्यै देखिँदैन)", pfEmailOk: "✔ इमेल प्रमाणित", pfEmailNo: "इमेल प्रमाणित छैन",
    pfVerifyEmail: "मेरो इमेल प्रमाणित गर्नुहोस्",
    pfPhone: "फोन नम्बर", pfPhoneOk: "✔ SMS कोडबाट प्रमाणित", pfPhoneNo: "प्रमाणित छैन",
    pvSend: "यो नम्बर SMS कोडबाट प्रमाणित गर्नुहोस्", pvCodePh: "६ अंकको कोड", pvConfirm: "कोड पुष्टि गर्नुहोस्",
    pvSent: "कोड पठाइयो। SMS मा आएको ६ अंकको कोड हाल्नुहोस्।", pvDone: "फोन नम्बर प्रमाणित भयो ✔",
    pfSave: "प्रोफाइल सेभ गर्नुहोस्", pfSaved: "प्रोफाइल सेभ भयो!", pfViewPublic: "मेरो सार्वजनिक प्रोफाइल हेर्नुहोस्",
    pfMeta: "सदस्य बनेको: {since} · मेरा कोठा: {rooms} · मनपर्ने: {favs}",
    pfInfo: "(तपाईंका कोठाबाट) तपाईंको सार्वजनिक प्रोफाइल खोल्नेहरूले देख्न सक्छन्: तपाईंको नाम, फोटो र मेरो बारेमा, तपाईंको देश (बाकस टिक गरेमा मात्र), जोडिएको मिति, प्रमाणीकरणका चिन्ह र तपाईंका कोठा। उनीहरूले तपाईंको इमेल, पासवर्ड, मनपर्ने, खोज वा फोनको लोकेसन कहिल्यै देख्दैनन्। तपाईंको फोन नम्बर तपाईंले नलुकाएका कोठामा मात्र देखिन्छ (सेटिङ, गोपनीयता)।",
    pfNameShort: "कृपया आफ्नो नाम लेख्नुहोस् (कम्तीमा २ अक्षर)।",
    pfRoomsPhoneFail: "तपाईंको प्रोफाइल सेभ भयो, तर तपाईंका कोठाको नम्बर बदल्न सकिएन। प्रमाणित नम्बरबाट स्वीकृत भएका कोठाले त्यही प्रमाणित नम्बर मात्र देखाउन सक्छन्। पहिले नयाँ नम्बर प्रमाणित गर्नुहोस्।",
    ovRooms: "यी मालिकका कोठा", ovNone: "अहिले कुनै उपलब्ध कोठा छैन।",
    ovNoProfile: "यी मालिकले अहिलेसम्म सार्वजनिक प्रोफाइल लेखेका छैनन्।",
    ovSince: "सदस्य बनेको: {d}", ovCountry: "देश: {c}",
    ovEmail: "✔ इमेल प्रमाणित", ovPhone: "✔ फोन SMS बाट प्रमाणित",
    ownerProfile: "मालिकको प्रोफाइल", ownerBy: "{name} ले राख्नुभएको · प्रोफाइल हेर्नुहोस्", phoneVerifiedTag:"फोन प्रमाणित",
nudgeText: "आफ्नो प्रोफाइलमा फोन नम्बर प्रमाणित गर्नुहोस्, ताकि तपाईंका कोठा तुरुन्तै स्वीकृत हुन सकून्। यसबिना एडमिनले हरेक कोठा पहिले आफैं जाँच्छन्, जसमा बढी समय लाग्छ।",
  nudgeBtn: "मेरो फोन प्रमाणित गर्नुहोस्",
  needPhone: "कोठा थप्नुअघि आफ्नो प्रोफाइलमा फोन नम्बर प्रमाणित गर्नुहोस्।",
  chkPhone: "फोन नम्बर प्रमाणित छैन। तुरुन्त स्वीकृतिका लागि प्रोफाइलमा प्रमाणित गर्नुहोस्",
  chkPhoneOk: "फोन नम्बर SMS कोडबाट प्रमाणित",
  phoneMismatch: "ध्यान दिनुहोस्: यो कोठामा लेखिएको फोन नम्बर तपाईंको प्रमाणित नम्बर होइन, त्यसैले एडमिनले यसलाई जाँच्नेछन्।",
  pvErrInvalid: "सही १० अंकको फोन नम्बर हाल्नुहोस्।",
  pvErrMany: "धेरै प्रयास भयो। केही बेर पर्खेर फेरि प्रयास गर्नुहोस्।",
  pvErrQuota: "अहिलेको लागि SMS सीमा पुगेको छ। पछि फेरि प्रयास गर्नुहोस्।",
  pvErrNA: "फोन प्रमाणीकरण अहिले उपलब्ध छैन। यसका लागि Firebase मा फोन साइन-इन खुला हुनुपर्छ र SMS का लागि बिलिङ खाता चाहिन्छ।",
  pvErrCode: "कोड गलत छ। जाँचेर फेरि प्रयास गर्नुहोस्।",
  pvErrExpired: "यो कोडको म्याद सकियो। नयाँ कोड पठाउनुहोस्।",
  pvErrUsed: "यो फोन नम्बर अर्को Vhuba खातामा पहिले नै प्रयोग भइरहेको छ।",
  pvErrRecent: "कृपया लगआउट गरेर फेरि लगइन गर्नुहोस्, अनि एक पटक फेरि प्रयास गर्नुहोस्।",
  pvErrCaptcha: "सुरक्षा जाँच असफल भयो। फेरि प्रयास गर्नुहोस्।",
  pvErrNet: "इन्टरनेट छैन। कनेक्सन जाँच्नुहोस्।",
  privTitle: "गोपनीयता नीति र सर्तहरू",
  privText:
  "<p><b>गोपनीयता नीति र प्रयोगका सर्तहरू</b></p>" +
  "<p>पछिल्लो अपडेट: ८ नोभेम्बर २०२६</p>" +
  "<p><b>हामी को हौं।</b> Vhuba भाडाका कोठा खोज्ने र दिनेहरूलाई जोड्ने निःशुल्क एप हो। हामी जोड्ने काम मात्र गर्छौं। हामी ब्रोकर होइनौं, कुनै कोठाका मालिक वा व्यवस्थापक होइनौं, र कुनै भाडा सम्झौताको हिस्सा होइनौं।</p>" +
  "<p><b>को प्रयोग गर्न सक्छ।</b> तपाईंको उमेर १८ वर्ष वा सोभन्दा बढी हुनुपर्छ।</p>" +
  "<p><b>हामी के जानकारी लिन्छौं र किन।</b></p>" +
  "<p>• नाम, इमेल र फोन नम्बर: तपाईंको खाता बनाउन र सुरक्षित राख्न, र भाडामा लिनेहरूले तपाईंलाई सम्पर्क गर्न सकून् भनेर।</p>" +
  "<p>• तपाईंले Google बाट जारी राख्नुभयो भने, हामीले Google बाट तपाईंको नाम र इमेल पाउँछौं। हामीले तपाईंको Google पासवर्ड पाउँदैनौं।</p>" +
  "<p>• देश, प्रोफाइल फोटो र मेरो बारेमा: ऐच्छिक, तपाईंले थप्नुभयो भने मात्र।</p>" +
  "<p>• भाषा र डार्क मोडको रोजाइ, मनपर्ने कोठा, सेभ गरिएको खोज र पछिल्लो पटक हेरेको समय: एपलाई तपाईंको रोजाइअनुसार चलाउन।</p>" +
  "<p>• तपाईंले थपेका कोठाको विवरण (नाम, क्षेत्र, भाडा, डिपोजिट, खर्च, फोटो र चाहनुभयो भने लोकेसन पिन): अरूलाई कोठा देखाउन। लगइन गरेका जो कोहीले यो देख्न सक्छन्।</p>" +
  "<p>• तपाईंको फोन नम्बर तपाईंका कोठामा देखिन्छ, तपाईंले सेटिङमा नलुकाएसम्म। देखिँदा लगइन गरेका जो कोहीले तपाईंलाई फोन वा WhatsApp गर्न सक्छन्।</p>" +
  "<p>• फोन प्रमाणीकरण: तपाईंले फोन नम्बर प्रमाणित गर्नुभयो भने Google Firebase मार्फत एक पटकको SMS कोड पठाइन्छ र प्रमाणित नम्बर तपाईंको खातासँग जोडिन्छ। यो नम्बर तपाईंका कोठामा लेखिएको नम्बर तपाईंकै हो भनेर जाँच्न मात्र प्रयोग हुन्छ।</p>" +
  "<p>• तपाईंको फोनको लोकेसन: तपाईंले लोकेसनको बटन थिच्दा मात्र, कोठामा पिन राख्न वा नजिकका कोठा देखाउन। हामी पृष्ठभूमिमा तपाईंलाई ट्र्याक गर्दैनौं।</p>" +
  "<p>• तपाईंले पठाएका रिपोर्ट: एपलाई सुरक्षित राख्न।</p>" +
  "<p><b>तपाईंको सार्वजनिक प्रोफाइल।</b> तपाईंले कोठा भाडामा दिनुभयो भने, लगइन गरेका प्रयोगकर्ताले तपाईंका कोठाबाट तपाईंको सार्वजनिक प्रोफाइल खोल्न सक्छन्। त्यसमा यति मात्र देखिन्छ: तपाईंको नाम, फोटो र मेरो बारेमा (थप्नुभयो भने), तपाईंको देश (बाकस टिक गरेमा मात्र), जोडिएको मिति, इमेल र फोन प्रमाणित भएको चिन्ह, र तपाईंका कोठा। तपाईंको इमेल, पासवर्ड, मनपर्ने, खोज र फोनको लोकेसन कहिल्यै देखिँदैन। मेरो बारेमामा निजी जानकारी नलेख्नुहोस्।</p>" +
  "<p><b>डेटा कहाँ रहन्छ।</b> तपाईंको डेटा Google Firebase मा रहन्छ (सर्भर तपाईंको देशबाहिर पनि हुन सक्छ)। एप GitHub Pages मा चल्छ। फोन डायलर, WhatsApp र Google Maps Vhuba बाहिर खुल्छन् र तिनमा तिनका आफ्नै नियम लाग्छन्।</p>" +
  "<p><b>हामी तपाईंको डेटा बेच्दैनौं</b> र विज्ञापन देखाउँदैनौं।</p>" +
  "<p><b>तपाईंका अधिकार र रोजाइ।</b> तपाईं प्रोफाइल र सेटिङमा नाम, फोन नम्बर, फोटो, मेरो बारेमा, देश र पासवर्ड बदल्न र फोन नम्बर लुकाउन सक्नुहुन्छ। तपाईं जुनसुकै बेला आफ्नो सहमति फिर्ता लिन र आफ्नो खाता र सबै कोठा हटाउन सक्नुहुन्छ: सेटिङ, खाता, खाता हटाउनुहोस्। आफ्नो डेटाको प्रतिलिपि माग्न, सच्याउन वा उजुरी गर्न सेटिङ, मद्दत र जानकारी, समस्या बताउनुहोस् मा लेख्नुहोस्। हामी सकेसम्म चाँडो जवाफ दिनेछौं। तपाईं आफ्नो देशको डेटा संरक्षण निकायमा पनि उजुरी गर्न सक्नुहुन्छ (भारतमा Data Protection Board of India)।</p>" +
  "<p><b>डेटा कति समय राख्छौं।</b> कोठा ३० दिनपछि आफैं लुक्छ, मालिकले नवीकरण नगरेसम्म। खाता हटाउँदा तपाईंको प्रोफाइल, सार्वजनिक प्रोफाइल र कोठा हट्छन्। ठगीका रिपोर्टका रेकर्ड सुरक्षाका लागि राखिन सक्छन्।</p>" +
  "<p><b>डेटाको सुरक्षा।</b> हामी प्रमाणित लगइन र डेटाबेसका नियम प्रयोग गर्छौं, ताकि मानिसहरूले आफ्नो डेटा मात्र बदल्न सकून्। कुनै पनि प्रणाली १००% सुरक्षित हुँदैन।</p>" +
  "<p><b>प्रयोगका नियम।</b></p>" +
  "<p>• आफू मालिक भएका वा भाडामा दिने अधिकार भएका वास्तविक कोठा मात्र थप्नुहोस्। 'मालिक' वा 'ब्रोकर' इमानदारीपूर्वक छान्नुहोस्।</p>" +
  "<p>• नक्कली कोठा, गलत भाडा, लुकेका खर्च, चोरेका फोटो वा ठगी गर्नु हुँदैन। कोठा नदेखाई कसैसँग टोकन वा अग्रिम पैसा नमाग्नुहोस्।</p>" +
  "<p>• एउटा खाताबाट बढीमा ५ कोठा।</p>" +
  "<p>• सम्मानपूर्वक व्यवहार गर्नुहोस् र रिपोर्टको बटनको दुरुपयोग नगर्नुहोस्।</p>" +
  "<p>• यी नियम तोड्नेको कोठा वा खाता हामी सूचना नदिई लुकाउन वा हटाउन सक्छौं।</p>" +
  "<p><b>सुरक्षित रहनुहोस्।</b> Vhuba ले हरेक कोठाको जाँच गर्दैन। 'प्रमाणित मालिक' को चिन्हले Vhuba एडमिनले ती व्यक्तिलाई कुनै तरिकाले जाँचेको मात्र जनाउँछ, र 'फोन प्रमाणित' को चिन्हले मालिकले त्यो नम्बरमा SMS कोड पाएको मात्र जनाउँछ। ती दुवै ग्यारेन्टी होइनन्। कुनै पनि पैसा दिनुअघि सधैं कोठा हेर्नुहोस् र मालिकलाई आफैं भेट्नुहोस्। नभेटेको मानिसलाई अनलाइन पैसा नपठाउनुहोस्। भाडा, डिपोजिट र सम्झौता तपाईं र अर्को व्यक्तिबीचको कुरा हो।</p>" +
  "<p><b>जिम्मेवारीको सीमा।</b> एप 'जस्तो छ त्यस्तै' दिइएको हो। कानुनले दिने हदसम्म, Vhuba प्रयोगकर्ताबीचको हानि, गलत जानकारी वा एप बन्द हुँदा हुने असुविधाको जिम्मेवार हुँदैन।</p>" +
  "<p><b>परिवर्तन।</b> हामी यसलाई बदल्न सक्छौं। ठूला परिवर्तन एपमा देखाइनेछन्।</p>" +
  "<p><b>सम्पर्क।</b> सेटिङ, मद्दत र जानकारी।</p>"
}
};

export default Z;