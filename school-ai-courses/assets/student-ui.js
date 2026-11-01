(() => {
  document.addEventListener("click", async (e) => {
    const copy=e.target.closest("[data-copy]");
    if(copy){
      e.preventDefault();
      const text=copy.dataset.copy||"";
      try{
        await navigator.clipboard.writeText(text);
        const oldHTML=copy.innerHTML; copy.textContent="Скопировано ✓"; copy.classList.add("done");
        setTimeout(()=>{copy.innerHTML=oldHTML;copy.classList.remove("done")},1500);
      }catch(_){copy.textContent="Не скопировалось";}
      return;
    }
    const filter=e.target.closest("[data-tool-filter]");
    if(filter){
      const buttons=[...document.querySelectorAll("[data-tool-filter]")];
      buttons.forEach(b=>{const active=b===filter;b.classList.toggle("active",active);b.setAttribute("aria-pressed",active?"true":"false");});
      const u=new URL(location.href);
      u.searchParams.set("filter",filter.dataset.toolFilter);
      history.replaceState(null,"",u);
      applyToolFilter(filter.dataset.toolFilter);
    }
  });
  const search=document.querySelector("[data-tool-search]");
  if(search){
    search.addEventListener("input",()=>{
      const u=new URL(location.href);
      if(search.value.trim()) u.searchParams.set("q",search.value.trim()); else u.searchParams.delete("q");
      history.replaceState(null,"",u);
      applyToolFilter();
    });
  }
  const categoryTerms={
    text:"текст тексты письмо письма статья статьи рассказ ответ объяснение пересказ написать написать текст",
    search:"поиск найти источник источники исследование исследования научный научная",
    ideas:"идея идеи план планы мозговой штурм создать сделать",
    slides:"презентация презентации слайд слайды схема схемы схему диаграмма диаграммы инфографика создать сделать",
    media:"картинка картинки изображение изображения рисунок иллюстрация дизайн создать генерировать нарисовать",
    video:"видео ролик ролики клип анимация создать сделать сгенерировать",
    music:"музыка голос озвучить озвучивание озвучка аудио песня песни звук синтез речи текст создать сделать",
    edit:"правка редактура изменить обработать редактирование",
    code:"код программа программирование сайт сайты приложение игра создать сделать написать",
    agents:"агент агенты автоматизация задача",
    aggregate:"агрегатор сравнение сравнить модель модели каталог"
  };
  const norm=s=>(s||"").toLocaleLowerCase("ru").replace(/ё/g,"е").replace(/[^\p{L}\p{N}]+/gu," ").trim();
  function applyToolFilter(forcedCategory){
    const buttons=[...document.querySelectorAll("[data-tool-filter]")];
    const active=forcedCategory||buttons.find(b=>b.getAttribute("aria-pressed")==="true")?.dataset.toolFilter||"all";
    const query=norm(search?.value);
    const words=query?query.split(/\s+/).filter(Boolean):[];
    const cards=[...document.querySelectorAll("[data-tool-cats]")];
    let shown=0;
    for(const card of cards){
      const cats=card.dataset.toolCats.split(/\s+/);
      const categoryText=cats.map(c=>categoryTerms[c]||"").join(" ");
      const haystack=norm(card.innerText+" "+card.dataset.toolSearch+" "+categoryText);
      const categoryMatch=active==="all"||cats.includes(active);
      const textMatch=words.every(word=>haystack.includes(word));
      card.hidden=!(categoryMatch&&textMatch);
      if(!card.hidden)shown++;
    }
    const output=document.querySelector("[data-tool-results]");
    if(output){
      output.textContent=shown?("Показано "+shown+" из "+cards.length+" инструментов"):"Ничего не найдено. Измени запрос или категорию.";
    }
  }
  const params=new URLSearchParams(location.search);
  if(search)search.value=params.get("q")||"";
  const buttons=[...document.querySelectorAll("[data-tool-filter]")];
  const hasAll=buttons.some(b=>b.dataset.toolFilter==="all");
  const initial=params.get("filter")||(hasAll?"all":"text");
  const start=buttons.find(b=>b.dataset.toolFilter===initial)||buttons.find(b=>b.dataset.toolFilter==="all")||buttons[0];
  if(start)start.click();
})();