import { checkEmptyFields, checkValidEmail } from "./utils.js";
import { PROTECTED_PATHS, PROTECTED_PATH_PREFIXES } from "./constants.js";

const navMenuItemLogIn = document.getElementById("navMenuItemLogIn");
const navMenuItemCart = document.getElementById("navMenuItemCart");
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

const SIGNUP_ERROR_MESSAGES = {
  400: "註冊失敗，請稍後再試",
  409: "此 Email 已被註冊",
  500: "註冊失敗，請稍後再試",
  default: "註冊失敗，請稍後再試",
};

const LOGIN_ERROR_MESSAGES = {
  400: "登入失敗，請稍後再試",
  401: "Email 或密碼錯誤",
  500: "登入失敗，請稍後再試",
  default: "登入失敗，請稍後再試",
};

// sign up
async function getSignUpData() {
  const name = document.querySelector("#dialogSignUp .signup-form__name");
  const email = document.querySelector("#dialogSignUp .signup-form__email");
  const password = document.querySelector(
    "#dialogSignUp .signup-form__password",
  );
  const requestBody = {
    name: name.value,
    email: email.value,
    password: password.value,
  };

  const checkEmptyResult = checkEmptyFields(requestBody);
  if (checkEmptyResult["error"]) {
    throw new Error(checkEmptyResult["message"]);
  }

  const checkEmailResult = checkValidEmail(requestBody["email"]);
  if (checkEmailResult["error"]) {
    throw new Error(checkEmailResult["message"]);
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

    if (!response.ok) {
      const error = new Error(
        SIGNUP_ERROR_MESSAGES[response.status] || SIGNUP_ERROR_MESSAGES.default,
      );
      error.status = response.status;
      throw error;
    }

    if (!result.ok) {
      throw new Error(SIGNUP_ERROR_MESSAGES.default);
    }

    return result;
  } catch (err) {
    console.error(`Error: ${err}`);

    if (err.status) {
      throw err;
    }
    throw new Error(SIGNUP_ERROR_MESSAGES.default);
  }
}

// check if sign up succeess
signUpBtn.addEventListener("click", async () => {
  try {
    await getSignUpData();

    const dialogSignUpMsg = dialogSignUp.querySelector(".dialog__message");
    dialogSignUpMsg.classList.add("success");
    dialogSignUpMsg.textContent = "註冊成功";
  } catch (err) {
    showDialogMessage(err.message || SIGNUP_ERROR_MESSAGES.default);
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

  let checkEmptyResult = checkEmptyFields(requestBody);
  if (checkEmptyResult["error"]) {
    throw new Error(checkEmptyResult["message"]);
  }

  let checkEmailResult = checkValidEmail(requestBody["email"]);
  if (checkEmailResult["error"]) {
    throw new Error(checkEmailResult["message"]);
  }

  const apiUrl = `/api/user/auth`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(
        LOGIN_ERROR_MESSAGES[response.status] || LOGIN_ERROR_MESSAGES.default,
      );
      error.status = response.status;
      throw error;
    }

    if (!result.token) {
      throw new Error(LOGIN_ERROR_MESSAGES.default);
    }

    return result;
  } catch (err) {
    console.error(`Error: ${err}`);

    if (err.status) {
      throw err;
    }
    throw new Error(LOGIN_ERROR_MESSAGES.default);
  }
}

// check if log in succeess
logInBtn.addEventListener("click", async () => {
  try {
    const result = await getLogInData();
    localStorage.setItem("logInToken", result.token);

    activeDialog = "dialogLogIn";
    closeDialog(activeDialog);
    location.reload();
  } catch (err) {
    showDialogMessage(err.message || LOGIN_ERROR_MESSAGES.default);
  }
});

// check log in status
async function decodeLogInToken() {
  const apiUrl = `/api/user/auth`;
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: getAuthHeaders(),
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
  if (logInToken !== null) {
    result = await decodeLogInToken();
    if (result["data"]) {
      isLogin = true;
    } else {
      clearLocalStorage();
    }
  }
  navMenuItemLogIn.textContent = isLogin ? "登出系統" : "登入/註冊";

  const pathname = window.location.pathname;
  const requiresAuth =
    PROTECTED_PATHS.includes(`${pathname}`) ||
    PROTECTED_PATH_PREFIXES.some((pathPrefix) =>
      pathname.startsWith(pathPrefix),
    );
  if (!isLogin && requiresAuth) {
    window.location.href = window.location.origin;
  }
  return { status: isLogin, userInfo: result };
}

function getAuthHeaders() {
  const token = localStorage.getItem("logInToken");

  return token ? { Authorization: `Bearer ${token}` } : {};
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
  closeDialog(activeDialog);
  document.body.style.overflowY = "visible";
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

// cart
navMenuItemCart.addEventListener("click", (e) => {
  if (!isLogin) {
    e.preventDefault();
    showDialog();
  } else {
    navMenuItemCart.href = `${window.location.origin}/cart`;
  }
});

export { checkLogInStatus, showDialog, getAuthHeaders };
