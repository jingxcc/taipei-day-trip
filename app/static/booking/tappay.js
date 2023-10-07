// tappay
import lib from "../shared/lib.js";
import env from "../shared/env.js";
// const TP_APP_ID = "137100";
// const TP_API_KEY =
//   "app_obrw78Lneq0srItqySarBnmMEt6icjTH0iJCeMkpDX2oBc4CA7kn3kATb3x6";

const TP_APP_ID = env.TP_APP_ID;
const TP_API_KEY = env.TP_API_KEY;

const confirmBtn = document.getElementById("confirmBtn");

TPDirect.setupSDK(TP_APP_ID, TP_API_KEY, "sandbox");
let TP_fields = {
  number: {
    // css selector
    element: "#card-number",
    placeholder: "**** **** **** ****",
  },
  expirationDate: {
    // DOM object
    element: document.getElementById("card-expiration-date"),
    placeholder: "MM / YY",
  },
  ccv: {
    element: "#card-ccv",
    placeholder: "CVV",
  },
};

TPDirect.card.setup({
  fields: TP_fields,
  styles: {
    // Style all elements
    input: {
      color: "gray",
      "line-height": "13.3px",
    },
    // Styling ccv field
    "input.ccv": {
      "font-size": "16px",
    },
    // Styling expiration-date field
    "input.expiration-date": {
      "font-size": "16px",
    },
    // Styling card-number field
    "input.card-number": {
      "font-size": "16px",
    },
    // style focus state
    ":focus": {
      color: "black",
    },
    // style valid state
    ".valid": {
      color: "green",
    },
    // style invalid state
    ".invalid": {
      color: "red",
    },
    // Media queries
    // Note that these apply to the iframe, not the root window.
    "@media screen and (max-width: 400px)": {
      input: {
        color: "orange",
      },
    },
  },
  // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
  isMaskCreditCardNumber: true,
  maskCreditCardNumberRange: {
    beginIndex: 99,
    endIndex: 99,
  },
});

TPDirect.card.onUpdate(function (update) {
  if (update.canGetPrime) {
    // Enable submit Button to get prime.
    confirmBtn.classList.remove("disabled");
  } else {
    // Disable submit Button to get prime.
    confirmBtn.classList.add("disabled");
  }
});

// get Prime from TP
function getTPPrimePromise() {
  return new Promise((resolve, reject) => {
    TPDirect.card.getPrime(async (result) => {
      if (result.status !== 0) {
        alert("Prime Error: " + result.msg);
        reject();
      }
      // console.log(result.card.prime);
      resolve(result.card.prime);
    });
  });
}

async function getTPPrime() {
  try {
    const result = await getTPPrimePromise();
    // console.log("Prime", result);
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
    return;
  }
}

async function createOrdersAndPay(requestBody) {
  let apiUrl = `/api/orders`;
  let logInToken = localStorage.getItem("logInToken");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${logInToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const responseData = await response.json();
      // console.log("responseData", responseData);
      return responseData;
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

confirmBtn.addEventListener("click", async () => {
  const contactInfo = document.querySelectorAll(".info-form__info > input");

  let isEmptyField = false;
  contactInfo.forEach((item) => {
    item["value"] = item["value"].trim();
    if (item["value"] === "") {
      isEmptyField = true;
    }
  });

  if (!isEmptyField) {
    if (!confirmBtn.classList.contains("disabled")) {
      let totalPrice = document.querySelector(
        ".confirm-info__total"
      ).textContent;
      totalPrice = lib.getNumFromStr(totalPrice);

      let bookingData = localStorage.getItem("bookingData");
      bookingData = !(bookingData === "")
        ? JSON.parse(bookingData)
        : bookingData;

      // console.log(isEmptyField);

      let orderData = {
        price: totalPrice,
        trip: bookingData["data"],
        contact: {
          name: contactInfo[0]["value"],
          email: contactInfo[1]["value"],
          phone: contactInfo[2]["value"],
        },
      };

      delete orderData["trip"]["price"];

      const TPPrime = await getTPPrime();
      let requestBody = {
        prime: TPPrime,
        order: orderData,
      };
      // console.log("requestBody");

      const createOrderResult = await createOrdersAndPay(requestBody);
      console.log("createOrderResult", createOrderResult);

      if ("data" in createOrderResult) {
        window.location.href = `${window.location.origin}/thankyou?number=${createOrderResult["data"]["number"]}`;
      } else {
        alert(`請稍後再試 ! \n${createOrderResult[message]}`);
      }
    }
  } else {
    alert("Please fill in all fields !");
  }
});
