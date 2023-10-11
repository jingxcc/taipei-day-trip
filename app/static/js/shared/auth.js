const navMenuItemLogIn = document.getElementById("navMenuItemLogIn");
const navMenuItemBooking = document.getElementById("navMenuItemBooking");
const dialogMask = document.getElementById("dialogMask");

const dialogLogIn = document.getElementById("dialogLogIn");
const logInCloseBtn = dialogLogIn.querySelector(".dialog__close-btn");
const logInToSignUp = dialogLogIn.querySelector(".dialog__link");
const logInBtn = document.getElementById("logInBtn");

const dialogSignUp = document.getElementById("dialogSignUp");
const signUpCloseBtn = dialogSignUp.querySelector(".dialog__close-btn");
const signUpToLogIn = dialogSignUp.querySelector(".dialog__link");
const signUpBtn = document.getElementById("signUpBtn");

let activeDialog = "dialogLogIn";
let isLogin;

// sign up
async function getSignUpData() {
  let name = document.querySelector("#dialogSignUp .signup-form__name");
  let email = document.querySelector("#dialogSignUp .signup-form__email");
  let password = document.querySelector("#dialogSignUp .signup-form__password");
  let requestBody = {
    name: name.value,
    email: email.value,
    password: password.value,
  };

  let isEmptyField = false;
  Object.keys(requestBody).forEach((item) => {
    requestBody[item] = requestBody[item].trim();
    if (requestBody[item] === "") {
      isEmptyField = true;
    }
  });

  if (isEmptyField) {
    message = "Please fill in all fields !";
    return {
      error: true,
      message: message,
    };
  }

  const apiUrl = `/api/user`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

// check if sign up succeess
signUpBtn.addEventListener("click", async () => {
  let result = await getSignUpData();
  console.log(result);

  if (!result["error"]) {
    const dialogSignUpMsg = dialogSignUp.querySelector(".dialog__message");
    dialogSignUpMsg.classList.add("success");
    dialogSignUpMsg.textContent = "註冊成功";
  } else if (result["error"]) {
    console.error(result["message"]);
    showDialogMessage(result["message"]);
  }
});

// log in
async function getLogInData() {
  let email = document.querySelector("#dialogLogIn .login-form__email");
  let password = document.querySelector("#dialogLogIn .login-form__password");
  let requestBody = {
    email: email.value,
    password: password.value,
  };

  const apiUrl = `/api/user/auth`;
  try {
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

// check if log in succeess
logInBtn.addEventListener("click", async () => {
  let result = await getLogInData();
  if (!result["error"]) {
    localStorage.setItem("logInToken", result["token"]);

    activeDialog = "dialogLogIn";
    closeDialog(activeDialog);
    location.reload();
  } else if (result["error"]) {
    console.error(result["message"]);
    showDialogMessage(result["message"]);
  }
});

// check log in status
async function decodeLogInToken(token) {
  const apiUrl = `/api/user/auth`;
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

async function checkLogInStatus() {
  isLogin = false;
  let logInToken = localStorage.getItem("logInToken");
  let result;
  console.log("checkLogInStatus");
  if (logInToken !== null) {
    result = await decodeLogInToken(logInToken);
    // let result = await decodeLogInToken(logInToken);
    // console.log(result);
    if (result["data"]) {
      isLogin = true;
      console.log("I already log in");
    } else {
      // isLogin = false;
      clearLocalStorage();
      console.log("local storage is clear when checking log-in status");
    }
  }
  navMenuItemLogIn.textContent = isLogin ? "登出系統" : "登入/註冊";

  const requireAuthPages = ["/booking", "/thankyou"];
  if (!isLogin) {
    console.log(requireAuthPages.includes(`${window.location.pathname}`));
    if (requireAuthPages.includes(`${window.location.pathname}`)) {
      window.location.href = window.location.origin;
    }
  }
  return { status: isLogin, userInfo: result };
}

// clear local storage data
function clearLocalStorage() {
  localStorage.clear();
  location.reload();
}

// dialog
navMenuItemLogIn.addEventListener("click", () => {
  if (!isLogin) {
    showDialog();
  } else {
    clearLocalStorage();
  }
});

dialogMask.addEventListener("click", (e) => {
  // if (e.target === dialogMask) {
  // const dialogBlockChildren = document.getElementById("dialogBlock").children;
  // for (let i = 0; i < dialogBlockChildren.length; i++) {
  //   dialogBlockChildren[i].classList.remove("block");
  // }

  closeDialog(activeDialog);
  document.body.style.overflowY = "visible";
  // }
});

function showDialog() {
  activeDialog = "dialogLogIn";
  dialogMask.classList.add("block");
  dialogLogIn.classList.add("block");
  document.body.style.overflowY = "hidden";
}

function toggleDialog(targetDialog) {
  if (targetDialog !== undefined) {
    activeDialog = targetDialog;
  }

  if (activeDialog === "dialogLogIn") {
    dialogLogIn.classList.add("block");
    dialogSignUp.classList.remove("block");
  } else if (activeDialog === "dialogSignUp") {
    dialogLogIn.classList.remove("block");
    dialogSignUp.classList.add("block");
  }
}

logInToSignUp.addEventListener("click", () => {
  toggleDialog("dialogSignUp");
});

signUpToLogIn.addEventListener("click", () => {
  toggleDialog("dialogLogIn");
});

function closeDialog(targetDialog) {
  if (targetDialog !== undefined) {
    activeDialog = targetDialog;
  }
  document
    .getElementById(activeDialog)
    .querySelector(".dialog__message").textContent = "";

  if (activeDialog === "dialogLogIn") {
    dialogLogIn.classList.remove("block");
  } else if (activeDialog === "dialogSignUp") {
    dialogSignUp.classList.remove("block");
  }
  dialogMask.classList.remove("block");
  document.body.style.overflowY = "visible";
}

logInCloseBtn.addEventListener("click", () => {
  closeDialog("dialogLogIn");
});

signUpCloseBtn.addEventListener("click", () => {
  closeDialog("dialogSignUp");
});

function showDialogMessage(msg) {
  if (activeDialog === "dialogLogIn") {
    dialogLogIn.querySelector(".dialog__message").classList.remove("success");
    dialogLogIn.querySelector(".dialog__message").textContent = msg;
  } else if (activeDialog === "dialogSignUp") {
    dialogSignUp.querySelector(".dialog__message").classList.remove("success");
    dialogSignUp.querySelector(".dialog__message").textContent = msg;
  }
}

// booking
navMenuItemBooking.addEventListener("click", (e) => {
  if (!isLogin) {
    e.preventDefault();
    showDialog();
  } else {
    navMenuItemBooking.href = `${window.location.origin}/booking`;
  }
});

export default { checkLogInStatus: checkLogInStatus, showDialog: showDialog };
