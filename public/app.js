// ✅ Ask for user's name and optional DP
let username = localStorage.getItem("sina-username");
let userDP = localStorage.getItem("sina-userdp");

function showProfileSetupModal() {
  const modal = document.getElementById("profile-setup-modal");
  const input = document.getElementById("profile-name");
  const dpInput = document.getElementById("profile-pic-input");
  const saveBtn = document.getElementById("save-profile");

  modal.style.display = "flex";

  saveBtn.onclick = () => {
    const name = input.value.trim() || "Anonymous";
    const file = dpInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const dp = e.target.result;
        localStorage.setItem("sina-userdp", dp);
        localStorage.setItem("sina-username", name);
        username = name;
        userDP = dp;
        modal.style.display = "none";
      };
      reader.readAsDataURL(file);
    } else {
      localStorage.setItem("sina-username", name);
      username = name;
      modal.style.display = "none";
    }
  };
}

if (!username) {
  showProfileSetupModal();
}

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhA19UFsWJpqfec7-qL1oxyRWIGdzta4I",
  authDomain: "sina-chat-6c3e9.firebaseapp.com",
  projectId: "sina-chat-6c3e9",
  storageBucket: "sina-chat-6c3e9.appspot.com",
  messagingSenderId: "419054378495",
  appId: "1:419054378495:web:92d20634ebfc12f2f49bca",
  databaseURL: "https://sina-chat-6c3e9-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ DOM Elements
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");
const clearButton = document.getElementById("clear-chat");
const themeToggle = document.getElementById("theme-toggle-checkbox");
const emojiBtn = document.getElementById("emoji-button");
const newMessageBtn = document.getElementById("new-message-btn");
const replyPreview = document.getElementById("reply-preview");
const replySenderEl = document.getElementById("reply-sender");
const replyTextEl = document.getElementById("reply-text");
const cancelReplyBtn = document.getElementById("cancel-reply");
const dmUserList = document.getElementById("dm-users");

let replyTo = null; // reply context

// ✅ Focus input on load
window.addEventListener("load", () => input.focus());

// ✅ Refocus on Enter key
window.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.keyCode === 13) && document.activeElement !== input) {
    e.preventDefault();
    input.focus();
  }
});

// ✅ Typing indicator toggle
input.addEventListener("input", () => {
  typingIndicator.style.display = input.value.trim() !== "" ? "flex" : "none";
});

// ✅ Send message
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const messageData = {
    name: username,
    dp: userDP || "",
    text,
    timestamp: Date.now(),
    ...(replyTo && {
      replyTo: {
        id: replyTo.id,
        name: replyTo.name,
        text: replyTo.text,
      },
    }),
  };

  db.ref("messages").push(messageData);
  input.value = "";
  typingIndicator.style.display = "none";
  clearReply();
});

cancelReplyBtn.addEventListener("click", clearReply);
function clearReply() {
  replyTo = null;
  replyPreview.style.display = "none";
  replySenderEl.textContent = "";
  replyTextEl.textContent = "";
}

function addMessage(senderName, messageText, time, messageId, replyData) {
  const message = document.createElement("div");
  message.dataset.id = messageId;
  const isMe = senderName === username;
  message.classList.add("message", isMe ? "me" : "other");

  const nameSpan = document.createElement("span");
  nameSpan.classList.add("sender-name");
  nameSpan.textContent = senderName;

  const textSpan = document.createElement("span");
  textSpan.classList.add("message-text");
  textSpan.textContent = messageText;

  const timeSpan = document.createElement("span");
  timeSpan.classList.add("timestamp");
  timeSpan.textContent = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  message.appendChild(nameSpan);

  if (replyData) {
    const replyDiv = document.createElement("div");
    replyDiv.className = "reply-info";
    replyDiv.style.cssText = `padding: 6px 10px; border-left: 3px solid #00cc66; margin-bottom: 6px; background: ${isMe ? "rgba(255,255,255,0.1)" : "#f0f0f0"}; border-radius: 6px; cursor: pointer;`;

    const replySender = document.createElement("div");
    replySender.style.fontWeight = "bold";
    replySender.style.fontSize = "13px";
    replySender.textContent = replyData.name;

    const replyText = document.createElement("div");
    replyText.style.fontSize = "13px";
    replyText.style.color = isMe ? "#ccc" : "#333";
    replyText.textContent = replyData.text.length > 60 ? replyData.text.slice(0, 60) + "…" : replyData.text;

    replyDiv.appendChild(replySender);
    replyDiv.appendChild(replyText);
    replyDiv.addEventListener("click", () => scrollToMessage(replyData.id));
    message.appendChild(replyDiv);
  }

  message.appendChild(textSpan);
  message.appendChild(timeSpan);
  messagesDiv.appendChild(message);

  message.classList.add("new-blink");
  setTimeout(() => message.classList.remove("new-blink"), 1000);

  const atBottom = messagesDiv.scrollTop + messagesDiv.clientHeight >= messagesDiv.scrollHeight - 50;
  if (atBottom) {
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });
  } else {
    newMessageBtn.style.display = 'block';
  }

  message.addEventListener("dblclick", () => {
    replyTo = {
      id: messageId,
      name: senderName,
      text: messageText,
    };
    replySenderEl.textContent = senderName;
    replyTextEl.textContent = messageText;
    replyPreview.style.display = "flex";
    input.focus();
  });

  message.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    if (confirm("Delete this message?")) {
      db.ref("messages").child(messageId).remove();
      message.remove();
    }
  });
}

function scrollToMessage(id) {
  const target = document.querySelector(`[data-id="${id}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("new-blink");
    setTimeout(() => target.classList.remove("new-blink"), 1000);
  }
}

messagesDiv.innerHTML = "";
db.ref("messages").limitToLast(50).on("child_added", function (snapshot) {
  const msg = snapshot.val();
  addMessage(msg.name, msg.text, msg.timestamp, snapshot.key, msg.replyTo || null);
});

clearButton.addEventListener("click", function () {
  if (confirm("Are you sure you want to clear the entire chat?")) {
    db.ref("messages").remove();
    messagesDiv.innerHTML = "";
    messagesDiv.scrollTop = 0;
  }
});

if (localStorage.getItem("sina-theme") === "light") {
  document.body.classList.add("light-theme");
  themeToggle.checked = true;
}
themeToggle.addEventListener("change", function () {
  document.body.classList.toggle("light-theme");
  localStorage.setItem("sina-theme", themeToggle.checked ? "light" : "dark");
});

const picker = new EmojiButton({ position: "bottom-start", theme: "auto" });
emojiBtn.addEventListener("click", () => picker.togglePicker(emojiBtn));
picker.on("emoji", (emoji) => {
  input.value += emoji;
  input.focus();
});

newMessageBtn.addEventListener("click", () => {
  messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });
  newMessageBtn.style.display = 'none';
});

messagesDiv.addEventListener("scroll", () => {
  const nearBottom = messagesDiv.scrollTop + messagesDiv.clientHeight >= messagesDiv.scrollHeight - 100;
  if (nearBottom) newMessageBtn.style.display = 'none';
});

// ✅ Load DM user list
function loadDMUsers() {
  db.ref("messages").limitToLast(100).once("value", (snapshot) => {
    const userMap = {};
    snapshot.forEach((child) => {
      const msg = child.val();
      if (!userMap[msg.name]) {
        userMap[msg.name] = msg.dp || "";
      }
    });
    dmUserList.innerHTML = "";
    Object.entries(userMap).forEach(([name, dp]) => {
      const userDiv = document.createElement("li");
      userDiv.className = "dm-user";
      const avatar = document.createElement("img");
      avatar.className = "dm-avatar";
      if (dp) avatar.src = dp;
      else avatar.textContent = name[0]?.toUpperCase() || "?";
      const uname = document.createElement("span");
      uname.className = "dm-username";
      uname.textContent = name;
      userDiv.appendChild(avatar);
      userDiv.appendChild(uname);
      dmUserList.appendChild(userDiv);
    });
  });
}
loadDMUsers();
