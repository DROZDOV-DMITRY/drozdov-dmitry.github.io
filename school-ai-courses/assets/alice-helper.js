
window.S14AliceHelper = (() => {
  const SHARED_CHAT_URL = "";
  const FALLBACK_URL = "https://alice.yandex.ru/";
  const BOOTSTRAP = [
    "Ты помощник школьника школы №14 по компьютерной грамотности.",
    "Отвечай очень коротко: одно действие за раз.",
    "Если речь о Windows или браузере — ориентируйся на обычный школьный ноутбук и Microsoft Edge.",
    "Если ребёнок прислал скриншот, сначала опиши, куда нажать на нём.",
    "Не проси пароль, код подтверждения, токен или другие секретные данные.",
    "Если не понимаешь ситуацию — спроси, что именно видно на экране.",
    "После каждого действия спрашивай: получилось?"
  ].join("\n");

  function popup(url){
    const w = Math.min(560, Math.max(360, screen.availWidth * .42));
    const h = Math.min(820, Math.max(580, screen.availHeight * .86));
    const left = Math.max(0, screen.availWidth - w - 24);
    const top = Math.max(0, (screen.availHeight - h) / 2);
    window.open(url, "s14AliceHelper", `popup=yes,width=${Math.round(w)},height=${Math.round(h)},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`);
  }

  async function open(mode="computer"){
    if (SHARED_CHAT_URL) {
      popup(SHARED_CHAT_URL);
      return;
    }
    if(mode==="computer"){ try { await navigator.clipboard.writeText(BOOTSTRAP); } catch (_) {} }
    popup(FALLBACK_URL);
  }

  return { open, bootstrap: BOOTSTRAP };
})();

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-alice-helper]");
  if (!btn) return;
  e.preventDefault();
  window.S14AliceHelper.open(btn.dataset.aliceMode || "computer");
});
