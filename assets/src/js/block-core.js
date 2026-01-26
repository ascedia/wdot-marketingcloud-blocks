(() => {
  function inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isValidHttpUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function setFieldError(id, message) {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(id + "Error");
    const hasError = !!message;
    if (input) input.classList.toggle("is-invalid", hasError);
    if (errorEl) {
      errorEl.textContent = message || "";
      errorEl.style.display = hasError ? "block" : "none";
    }
  }

  function applyErrors(fieldIds, errors) {
    fieldIds.forEach((id) => setFieldError(id, errors[id]));
  }

  function debounce(fn, waitMs) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), waitMs);
    };
  }

  function setFormValues(fieldIds, data) {
    fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = data[id] || "";
    });
  }

  function getFormValues(fieldIds) {
    return fieldIds.reduce((acc, id) => {
      const el = document.getElementById(id);
      acc[id] = el ? el.value : "";
      return acc;
    }, {});
  }

  function initSdk(statusElId) {
    const statusEl = document.getElementById(statusElId);
    const hasSdk = !!(window.sfdc && window.sfdc.BlockSDK);
    const canInitSdk = hasSdk && inIframe();
    const sdk = canInitSdk ? new window.sfdc.BlockSDK() : null;

    if (!hasSdk) {
      if (statusEl) statusEl.textContent = "BlockSDK failed to load.";
    } else if (!sdk) {
      if (statusEl) statusEl.textContent = "Preview mode: SDK disabled.";
    } else if (statusEl) {
      statusEl.textContent = "";
    }

    return sdk;
  }

  function initBlock(config) {
    const {
      fieldIds,
      defaults,
      buildEmailHtml,
      validate = () => ({}),
      debounceMs = 250,
      statusElId = "sdkStatus",
      resetBtnId = "resetBtn",
      showErrors = true,
    } = config;

    const sdk = initSdk(statusElId);

    function syncToBlock() {
      const data = getFormValues(fieldIds);
      const errors = validate(data);
      if (showErrors) applyErrors(fieldIds, errors);
      if (!sdk) return;
      sdk.setData(data, function () {});
      if (Object.keys(errors).length > 0) return;
      sdk.setContent(buildEmailHtml(data), function () {});
    }

    if (sdk) {
      sdk.getData((data) => {
        const merged = { ...defaults, ...(data || {}) };
        setFormValues(fieldIds, merged);
        sdk.setData(merged);
        sdk.setContent(buildEmailHtml(merged));
      });
    } else {
      setFormValues(fieldIds, defaults);
    }

    fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", debounce(syncToBlock, debounceMs));
    });

    const resetBtn = document.getElementById(resetBtnId);
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        setFormValues(fieldIds, defaults);
        if (showErrors) applyErrors(fieldIds, {});
        if (!sdk) return;
        sdk.setData(defaults);
        sdk.setContent(buildEmailHtml(defaults));
      });
    }
  }

  window.BlockCore = {
    initBlock,
    escapeHtml,
    isValidHttpUrl,
  };
})();
