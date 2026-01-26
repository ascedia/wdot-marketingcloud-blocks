"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
(function () {
  function inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }
  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function isValidHttpUrl(value) {
    try {
      var url = new URL(String(value || "").trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_unused) {
      return false;
    }
  }
  function setFieldError(id, message) {
    var input = document.getElementById(id);
    var errorEl = document.getElementById(id + "Error");
    var hasError = !!message;
    if (input) input.classList.toggle("is-invalid", hasError);
    if (errorEl) {
      errorEl.textContent = message || "";
      errorEl.style.display = hasError ? "block" : "none";
    }
  }
  function applyErrors(fieldIds, errors) {
    fieldIds.forEach(function (id) {
      return setFieldError(id, errors[id]);
    });
  }
  function debounce(fn, waitMs) {
    var t;
    return function () {
      var _this = this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      clearTimeout(t);
      t = setTimeout(function () {
        return fn.apply(_this, args);
      }, waitMs);
    };
  }
  function setFormValues(fieldIds, data) {
    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = data[id] || "";
    });
  }
  function getFormValues(fieldIds) {
    return fieldIds.reduce(function (acc, id) {
      var el = document.getElementById(id);
      acc[id] = el ? el.value : "";
      return acc;
    }, {});
  }
  function initSdk(statusElId) {
    var statusEl = document.getElementById(statusElId);
    var hasSdk = !!(window.sfdc && window.sfdc.BlockSDK);
    var canInitSdk = hasSdk && inIframe();
    var sdk = canInitSdk ? new window.sfdc.BlockSDK() : null;
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
    var fieldIds = config.fieldIds,
      defaults = config.defaults,
      buildEmailHtml = config.buildEmailHtml,
      _config$validate = config.validate,
      validate = _config$validate === void 0 ? function () {
        return {};
      } : _config$validate,
      _config$debounceMs = config.debounceMs,
      debounceMs = _config$debounceMs === void 0 ? 250 : _config$debounceMs,
      _config$statusElId = config.statusElId,
      statusElId = _config$statusElId === void 0 ? "sdkStatus" : _config$statusElId,
      _config$resetBtnId = config.resetBtnId,
      resetBtnId = _config$resetBtnId === void 0 ? "resetBtn" : _config$resetBtnId,
      _config$showErrors = config.showErrors,
      showErrors = _config$showErrors === void 0 ? true : _config$showErrors;
    var sdk = initSdk(statusElId);
    function syncToBlock() {
      var data = getFormValues(fieldIds);
      var errors = validate(data);
      if (showErrors) applyErrors(fieldIds, errors);
      if (!sdk) return;
      sdk.setData(data, function () {});
      if (Object.keys(errors).length > 0) return;
      sdk.setContent(buildEmailHtml(data), function () {});
    }
    if (sdk) {
      sdk.getData(function (data) {
        var merged = _objectSpread(_objectSpread({}, defaults), data || {});
        setFormValues(fieldIds, merged);
        sdk.setData(merged);
        sdk.setContent(buildEmailHtml(merged));
      });
    } else {
      setFormValues(fieldIds, defaults);
    }
    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", debounce(syncToBlock, debounceMs));
    });
    var resetBtn = document.getElementById(resetBtnId);
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        setFormValues(fieldIds, defaults);
        if (showErrors) applyErrors(fieldIds, {});
        if (!sdk) return;
        sdk.setData(defaults);
        sdk.setContent(buildEmailHtml(defaults));
      });
    }
  }
  window.BlockCore = {
    initBlock: initBlock,
    escapeHtml: escapeHtml,
    isValidHttpUrl: isValidHttpUrl
  };
})();