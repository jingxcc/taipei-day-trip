const navMenuItemLogIn = document.getElementById("navMenuItemLogIn");
const dialogMask = document.getElementById("dialogMask");
const dialogLogIn = document.getElementById("dialogLogIn");
const dialogSignUp = document.getElementById("dialogSignUp");
const logInBtn = document.getElementById("logInBtn");
const signUpBtn = document.getElementById("signUpBtn");

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

  console.log(requestBody);

  const apiUrl = `/api/user`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    // console.log(response);
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
    let activeDialog = "dialogSignUp";
    closeDialog(activeDialog);
  } else if (result["error"]) {
    console.error(result["message"]);
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

  console.log(requestBody);

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

    let activeDialog = "dialogLogIn";
    closeDialog(activeDialog);
    location.reload();
  } else if (result["error"]) {
    console.error(result["message"]);
  }
});

// ------
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
    // console.log(response);
    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

async function checkLogInStatus() {
  let logInToken = localStorage.getItem("logInToken");

  if (logInToken !== null) {
    let result = await decodeLogInToken(logInToken);
    if (result["data"]) {
      console.log("I already log in");
    } else {
      console.log("I do not log in");
    }
    console.log(`check logInToken: ${logInToken}`);
  }
}

// log out
function logOut() {
  localStorage.clear();
  location.reload();
}

// dialog
navMenuItemLogIn.addEventListener("click", () => {
  dialogMask.classList.add("block");
  dialogLogIn.classList.add("block");
  document.body.style.overflowY = "hidden";

  document.addEventListener("click", (e) => {
    if (e.target === dialogMask) {
      const dialogBlockChildren =
        document.getElementById("dialogBlock").children;
      for (let i = 0; i < dialogBlockChildren.length; i++) {
        dialogBlockChildren[i].classList.remove("block");
      }
      document.body.style.overflowY = "visible";
    }
  });
});

function toggleDialog(activeDialog) {
  if (activeDialog === "dialogLogIn") {
    dialogLogIn.classList.add("block");
    dialogSignUp.classList.remove("block");
  } else if (activeDialog === "dialogSignUp") {
    dialogLogIn.classList.remove("block");
    dialogSignUp.classList.add("block");
  }
}

function closeDialog(activeDialog) {
  if (activeDialog === "dialogLogIn") {
    dialogLogIn.classList.remove("block");
  } else if (activeDialog === "dialogSignUp") {
    dialogSignUp.classList.remove("block");
  }
  dialogMask.classList.remove("block");
  document.body.style.overflowY = "visible";
}

document.addEventListener("DOMContentLoaded", () => {
  checkLogInStatus();
});
