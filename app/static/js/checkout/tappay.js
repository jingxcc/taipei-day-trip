// tappay
import {
  checkValidEmail,
  checkValidPhoneNumber,
  getLastPathSegment,
} from "../shared/utils.js";
import env from "../shared/env.js";
import { hideLoader, showLoader } from "../shared/loading.js";
import { getAuthHeaders } from "../shared/auth.js";

const TP_APP_ID = env.TP_APP_ID;
const TP_API_KEY = env.TP_API_KEY;

const MESSAGES = {
  emptyContact: "請填寫必要資訊",
  invalidBookingId: "預訂編號無效，請返回購物車重新選擇",
  requestFailed: "付款請求失敗，請稍後再試",
  paymentFailed: "付款失敗，請重新付款",
};

const confirmBtn = document.getElementById("confirmBtn");
const paymentState = {
  canGetPrime: false,
  isSubmitting: false,
};

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

function updateConfirmButtonState() {
  const isCardNotReady = !paymentState.canGetPrime;

  confirmBtn.disabled = isCardNotReady || paymentState.isSubmitting;
}

TPDirect.card.onUpdate(function (update) {
  paymentState.canGetPrime = update.canGetPrime;
  updateConfirmButtonState();
});

// get prime
function getTPPrime() {
  return new Promise((resolve, reject) => {
    TPDirect.card.getPrime((result) => {
      if (result.status !== 0) {
        reject(new Error(result.msg || MESSAGES.requestFailed));
        return;
      }

      resolve(result.card.prime);
    });
  });
}

async function createOrdersAndPay(requestBody) {
  let apiUrl = `/api/orders`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || MESSAGES.requestFailed);
    }
    return responseData;
  } catch (err) {
    console.error(`Error: ${err}`);
    throw err;
  }
}

confirmBtn.addEventListener("click", async () => {
  const contact = {
    name: document.querySelector(".info-form__name").value.trim(),
    email: document.querySelector(".info-form__email").value.trim(),
    phone: document.querySelector(".info-form__phone").value.trim(),
  };

  const hasEmptyContactField = Object.values(contact).some(
    (value) => value === "",
  );
  if (hasEmptyContactField) {
    alert(MESSAGES.emptyContact);
    return;
  }

  if (confirmBtn.disabled) return;

  const bookingId = Number(getLastPathSegment(window.location.pathname));
  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
    alert(MESSAGES.invalidBookingId);
    return;
  }
  const emailResult = checkValidEmail(contact.email);
  if (emailResult.error) {
    alert(emailResult.message);
    return;
  }
  const phoneResult = checkValidPhoneNumber(contact.phone);
  if (phoneResult.error) {
    alert(phoneResult.message);
    return;
  }

  paymentState.isSubmitting = true;
  updateConfirmButtonState();

  showLoader();
  try {
    const prime = await getTPPrime();

    const result = await createOrdersAndPay({ bookingId, prime, contact });
    if (result.data.payment.status === 0) {
      const params = new URLSearchParams({ number: result.data.number });
      window.location.href = `/thankyou?${params.toString()}`;
    } else {
      alert(result.data.payment.message || MESSAGES.paymentFailed);
    }
  } catch (error) {
    alert(error.message || MESSAGES.requestFailed);
  } finally {
    hideLoader();

    paymentState.isSubmitting = false;
    updateConfirmButtonState();
  }
});
