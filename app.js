
// Cronograma Semanal — app.js
const DAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const weekGrid = document.getElementById('weekGrid');
const novoTaskBtn = document.getElementById('novoTaskBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const taskForm = document.getElementById('taskForm');
const cancelBtn = document.getElementById('cancelBtn');
const daySelect = document.getElementById('day');
const searchInput = document.getElementById('searchInput');

let tasks = []; // {id,title,day,time,desc}
let editingId = null;

// --- Inicialização ---
function init(){
  // popular select de dias
  DAYS.forEach((d,i)=>{
    const opt = document.createElement('option'); opt.value = i; opt.textContent = d; daySelect.appendChild(opt);
  });
  load();
  renderGrid();
  attachEvents();
}

function attachEvents(){
  novoTaskBtn.addEventListener('click', ()=>openModal());
  cancelBtn.addEventListener('click', closeModal);
  taskForm.addEventListener('submit', onSaveTask);
  searchInput.addEventListener('input', () => renderGrid(searchInput.value.trim().toLowerCase()));
  // fechar modal clicando fora
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
}

// --- storage ---
function save(){
  localStorage.setItem('cronograma_tasks_v1', JSON.stringify(tasks));
}
function load(){
  const raw = localStorage.getItem('cronograma_tasks_v1');
  if(raw) tasks = JSON.parse(raw);
}

// --- modal ---
function openModal(task){
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  if(task){
    modalTitle.textContent = 'Editar tarefa';
    editingId = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('time').value = task.time || '';
    document.getElementById('desc').value = task.desc || '';
    document.getElementById('day').value = task.day;
  } else {
    modalTitle.textContent = 'Nova tarefa';
    editingId = null;
    taskForm.reset();
  }
  document.getElementById('title').focus();
}
function closeModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

function onSaveTask(e){
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const day = Number(document.getElementById('day').value);
  const time = document.getElementById('time').value;
  const desc = document.getElementById('desc').value.trim();
  if(!title) return;

  if(editingId){
    const idx = tasks.findIndex(t=>t.id===editingId);
    if(idx>=0){
      tasks[idx] = {...tasks[idx], title, day, time, desc};
    }
  } else {
    const newTask = {id:crypto.randomUUID(), title, day, time, desc, done:false};
    tasks.push(newTask);
  }
  save();
  closeModal();
  renderGrid(searchInput.value.trim().toLowerCase());
}

// --- renderização ---
function renderGrid(filter=''){
  weekGrid.innerHTML = '';
  DAYS.forEach((d,i)=>{
    const card = document.createElement('section'); card.className = 'day-card';
    const header = document.createElement('div'); header.className = 'day-header';
    const title = document.createElement('strong'); title.textContent = d;
    const count = document.createElement('span');
    const dayTasks = tasks.filter(t=>t.day===i && (filter === '' || t.title.toLowerCase().includes(filter) || (t.desc||'').toLowerCase().includes(filter)));
    count.textContent = `${dayTasks.length}`;
    header.appendChild(title); header.appendChild(count);

    const tasksWrap = document.createElement('div'); tasksWrap.className = 'tasks';
    dayTasks.sort((a,b)=>{ if(a.time && b.time) return a.time.localeCompare(b.time); if(a.time) return -1; if(b.time) return 1; return a.title.localeCompare(b.title); });

    dayTasks.forEach(t=>{
      const tpl = document.getElementById('taskTemplate');
      const node = tpl.content.cloneNode(true);
      const article = node.querySelector('.task');
      const titleEl = node.querySelector('.task-title');
      const timeEl = node.querySelector('.task-time');
      titleEl.textContent = t.title;
      timeEl.textContent = t.time ? t.time : (t.desc ? t.desc.slice(0,30) : '');
      if(t.done) article.classList.add('done');

      // ações
      node.querySelector('.edit').addEventListener('click', ()=>openModal(t));
      node.querySelector('.delete').addEventListener('click', ()=>{ if(confirm('Excluir tarefa?')){ tasks = tasks.filter(x=>x.id!==t.id); save(); renderGrid(filter);} });

      // drag & drop handlers
      article.addEventListener('dragstart', (ev)=>{ ev.dataTransfer.setData('text/plain', t.id); article.classList.add('dragging'); });
      article.addEventListener('dragend', ()=>{ article.classList.remove('dragging'); });

      tasksWrap.appendChild(node);
    });

    // permitir soltar tarefas neste dia
    card.addEventListener('dragover', (ev)=>{ ev.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', ()=>{ card.classList.remove('drag-over'); });
    card.addEventListener('drop', (ev)=>{
      ev.preventDefault(); card.classList.remove('drag-over');
      const id = ev.dataTransfer.getData('text/plain');
      const idx = tasks.findIndex(t=>t.id===id);
      if(idx>=0){ tasks[idx].day = i; save(); renderGrid(filter); }
    });

    card.appendChild(header);
    card.appendChild(tasksWrap);
    weekGrid.appendChild(card);
  });
}

// --- iniciar app ---
init();
