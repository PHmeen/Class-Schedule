// ==========================================================================
// STATE MANAGEMENT & CONFIGURATION (รองรับหลายตารางเรียน)
// ==========================================================================
let schedules = [];         // รายการตารางเรียนทั้งหมด: [{ id, name, subjects: [] }]
let activeScheduleId = '';  // ไอดีตารางเรียนที่กำลังเปิดอยู่
let currentView = 'weekly';
let gridOrientation = 'horizontal'; // ทิศทางตารางเรียน: 'horizontal' หรือ 'vertical'
let activeMobileDay = 'Monday';
let lastDeletedSubject = null; // เก็บข้อมูลย้อนหลังสำหรับกู้คืนรายวิชา
let lastDeletedSchedule = null; // เก็บข้อมูลย้อนหลังสำหรับกู้คืนตารางเรียน

const START_HOUR = 8; 
const END_HOUR = 20;  
const TOTAL_ROWS = (END_HOUR - START_HOUR) * 2; 

// สีดั้งเดิม -> สีพรีเมียม
const colorMap = {
    'pink': 'coral',
    'blue': 'indigo',
    'green': 'emerald',
    'yellow': 'amber',
    'lavender': 'amethyst',
    'indigo': 'indigo',
    'emerald': 'emerald',
    'coral': 'coral',
    'amethyst': 'amethyst',
    'amber': 'amber'
};

const dayColumnIndices = {
    'Monday': 2, 'Tuesday': 3, 'Wednesday': 4, 'Thursday': 5, 'Friday': 6, 'Saturday': 7, 'Sunday': 8
};

const columnIndexToDay = {
    2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday', 8: 'Sunday'
};

const dayNamesTh = {
    'Monday': 'วันจันทร์', 'Tuesday': 'วันอังคาร', 'Wednesday': 'วันพุธ', 'Thursday': 'วันพฤหัสบดี', 'Friday': 'วันศุกร์', 'Saturday': 'วันเสาร์', 'Sunday': 'วันอาทิตย์'
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadSchedules();
    updateClock();
    setInterval(updateClock, 1000);

    setupEventListeners();
    initCustomizer();
    setupOnlineStatusMonitor();
    render();
}



// โหลดรายชื่อตารางเรียนและข้อมูลวิชาเรียนทั้งหมด (รองรับการโอนย้ายตารางเก่าไม่ให้หาย)
function loadSchedules() {
    gridOrientation = localStorage.getItem('my_grid_orientation') || 'horizontal';
    
    const listData = localStorage.getItem('my_schedules_list');
    const activeId = localStorage.getItem('my_active_schedule_id');

    if (listData) {
        try {
            schedules = JSON.parse(listData);
            activeScheduleId = activeId;
            
            // ตรวจสอบว่าไอดีที่ระบุไว้มีอยู่จริงหรือไม่
            if (!schedules.some(s => s.id === activeScheduleId)) {
                activeScheduleId = schedules[0].id;
            }
        } catch (e) {
            console.error('Error parsing schedules list:', e);
            schedules = [];
        }
    }

    // กรณีรันครั้งแรก หรือย้ายฐานข้อมูลเก่า (ตารางเก่าต้องไม่หาย!)
    if (schedules.length === 0) {
        const legacyData = localStorage.getItem('my_sweet_schedule');
        let initialSubjects = [];
        
        if (legacyData) {
            try {
                // ดึงข้อมูลตารางเก่า
                initialSubjects = JSON.parse(legacyData).map(sub => ({
                    ...sub,
                    color: colorMap[sub.color] || 'indigo'
                }));
                console.log('Migrated legacy schedule subjects safely.');
            } catch (e) {
                console.error('Error parsing legacy schedule:', e);
            }
        }

        // ห่อหุ้มเป็นตารางเรียนหลัก
        const defaultSchedule = {
            id: 'sch_' + Date.now(),
            name: 'ตารางหลักของฉัน 🌸',
            subjects: initialSubjects
        };

        schedules = [defaultSchedule];
        activeScheduleId = defaultSchedule.id;
        saveSchedules();
    }

    // เพิ่มและอัปเดตตารางเรียนภาคการศึกษา 1/2569 ของผู้ใช้ลงในระบบโดยอัตโนมัติ
    const semester1_2569Name = 'ภาคการศึกษา 1/2569 📚';
    if (!schedules.some(s => s.name === semester1_2569Name)) {
        const term1_2569Schedule = {
            id: 'sch_1_2569_' + Date.now(),
            name: semester1_2569Name,
            subjects: [
                {
                    id: 'sub_1_2569_1',
                    subjectCode: '308-421',
                    subjectName: 'การประยุกต์เทคโนโลยีสารสนเทศและการสื่อสารเพื่องานอาชีพ',
                    teacher: 'เถกิง วงศ์ศิริโชติ',
                    day: 'Friday',
                    startTime: '08:00',
                    endTime: '09:50',
                    room: 'BSc0409(LAB)',
                    color: 'indigo'
                },
                {
                    id: 'sub_1_2569_2',
                    subjectCode: '308-325',
                    subjectName: 'โครงงานทางเทคโนโลยีสารสนเทศและการสื่อสาร 2',
                    teacher: 'น้ำทิพย์ ตระกูลเมฆี',
                    day: 'Thursday',
                    startTime: '15:00',
                    endTime: '18:50',
                    room: 'BSc0503/1',
                    color: 'coral'
                },
                {
                    id: 'sub_1_2569_3',
                    subjectCode: '308-493',
                    subjectName: 'ชุดวิชาแอปพลิเคชันบนอุปกรณ์พกพา แบบข้ามแพลตฟอร์มและการประยุกต์',
                    teacher: 'สุขกมล สุขพิศิษฐ์',
                    day: 'Monday',
                    startTime: '13:00',
                    endTime: '16:50',
                    room: 'BSc0409(LAB)',
                    color: 'emerald'
                },
                {
                    id: 'sub_1_2569_4',
                    subjectCode: '308-493',
                    subjectName: 'ชุดวิชาแอปพลิเคชันบนอุปกรณ์พกพา แบบข้ามแพลตฟอร์มและการประยุกต์',
                    teacher: 'สุขกมล สุขพิศิษฐ์',
                    day: 'Wednesday',
                    startTime: '13:00',
                    endTime: '16:50',
                    room: 'BSc0409(LAB)',
                    color: 'emerald'
                },
                {
                    id: 'sub_1_2569_5',
                    subjectCode: '308-493',
                    subjectName: 'ชุดวิชาแอปพลิเคชันบนอุปกรณ์พกพา แบบข้ามแพลตฟอร์มและการประยุกต์',
                    teacher: 'สุขกมล สุขพิศิษฐ์',
                    day: 'Friday',
                    startTime: '15:00',
                    endTime: '16:50',
                    room: 'BSc0408(LAB)',
                    color: 'emerald'
                }
            ]
        };
        schedules.push(term1_2569Schedule);
        activeScheduleId = term1_2569Schedule.id;
        saveSchedules();
    }

    // ปรับปรุงเมนู Dropdown ตารางเรียน
    updateScheduleDropdown();
}

function saveSchedules() {
    localStorage.setItem('my_schedules_list', JSON.stringify(schedules));
    localStorage.setItem('my_active_schedule_id', activeScheduleId);
    
    // สำรองค่าตารางปัจจุบันลงในคีย์เก่าเพื่อให้ระบบภาพรวมและตัวส่งออกทำงานร่วมกันได้
    const activeSch = getActiveSchedule();
    if (activeSch) {
        localStorage.setItem('my_sweet_schedule', JSON.stringify(activeSch.subjects));
    }
}

// ดึงออบเจ็กต์ตารางเรียนที่ใช้งานอยู่ปัจจุบัน
function getActiveSchedule() {
    return schedules.find(s => s.id === activeScheduleId) || schedules[0];
}

// เคลียร์และวาดรายการใน Dropdown ตารางเรียนใหม่
function updateScheduleDropdown() {
    const select = document.getElementById('schedule-select');
    if (!select) return;

    select.innerHTML = '';
    schedules.forEach(sch => {
        const opt = document.createElement('option');
        opt.value = sch.id;
        opt.innerText = sch.name;
        if (sch.id === activeScheduleId) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

// ==========================================================================
// RENDER & TIMETABLE GRID GENERATION
// ==========================================================================
function render() {
    if (currentView === 'weekly') {
        renderWeeklyGrid();
    } else {
        renderTodayView();
    }
}

// สลับมุมมองตาราง
function switchView(view) {
    currentView = view;
    document.getElementById('toggle-weekly').classList.toggle('active', view === 'weekly');
    document.getElementById('toggle-today').classList.toggle('active', view === 'today');
    document.getElementById('view-weekly-container').classList.toggle('active', view === 'weekly');
    document.getElementById('view-today-container').classList.toggle('active', view === 'today');
    
    const mobileSelector = document.getElementById('mobile-day-tabs');
    if (mobileSelector) {
        mobileSelector.style.display = (view === 'weekly') ? '' : 'none';
    }

    render();
}
window.switchView = switchView;

function renderWeeklyGrid() {
    const grid = document.getElementById('timetable-weekly-grid');
    if (!grid) return;

    // ตั้งค่าวันใช้งานบนตารางมือถือลงใน attribute เพื่อให้ CSS ทำงาน
    grid.setAttribute('data-active-day', activeMobileDay);

    // กำหนด Class ตามทิศทางตารางเรียน
    grid.className = `timetable-grid ${gridOrientation}`;

    // 1. เคลียร์บล็อคเก่าๆ ออกไป ยกเว้นหัวข้อตาราง (Header)
    const elementsToRemove = grid.querySelectorAll('.time-axis-cell, .grid-cell, .subject-card, .grid-empty-state');
    elementsToRemove.forEach(el => el.remove());

    if (gridOrientation === 'horizontal') {
        // --- แนวนอน ---
        // 2. สร้างเส้นแกนเวลาด้านบนแนวนอน (08:00 - 19:00)
        for (let hour = START_HOUR; hour < END_HOUR; hour++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-axis-cell';
            const startCol = (hour - START_HOUR) * 2 + 2;
            timeCell.style.gridColumn = `${startCol} / ${startCol + 2}`;
            timeCell.style.gridRow = '1';
            timeCell.innerText = `${String(hour).padStart(2, '0')}:00`;
            grid.appendChild(timeCell);
        }

        // 3. สร้างช่อง Grid เส้นร่างพื้นหลังตารางเรียน
        for (let dayRow = 2; dayRow <= 8; dayRow++) {
            const dayName = columnIndexToDay[dayRow];
            
            for (let slot = 0; slot < TOTAL_ROWS; slot++) {
                const colNum = slot + 2;
                const isHourEnd = (slot % 2 === 1); 
                
                const totalMinutes = slot * 30;
                const hour = Math.floor(totalMinutes / 60) + START_HOUR;
                const minute = totalMinutes % 60;
                const timeVal = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

                const cell = document.createElement('div');
                cell.className = `grid-cell ${isHourEnd ? 'hour-line' : ''}`;
                cell.style.gridRow = `${dayRow}`;
                cell.style.gridColumn = `${colNum}`;
                cell.setAttribute('data-day', dayName); 
                
                cell.style.pointerEvents = 'auto'; 
                cell.style.cursor = 'pointer';
                cell.title = `คลิกเพื่อเพิ่มวิชาเรียนตรงกับ วัน${dayNamesTh[dayName]} เวลา ${timeVal} น.`;
                
                cell.addEventListener('click', () => {
                    openAddModalAt(dayName, timeVal);
                });

                grid.appendChild(cell);
            }
        }
    } else {
        // --- แนวตั้ง ---
        // 2. สร้างเส้นแกนเวลาด้านซ้ายแนวตั้ง (08:00 - 19:00)
        for (let hour = START_HOUR; hour < END_HOUR; hour++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-axis-cell';
            const startRow = (hour - START_HOUR) * 2 + 2;
            timeCell.style.gridRow = `${startRow} / ${startRow + 2}`;
            timeCell.style.gridColumn = '1';
            timeCell.innerText = `${String(hour).padStart(2, '0')}:00`;
            grid.appendChild(timeCell);
        }

        // 3. สร้างช่อง Grid เส้นร่างพื้นหลังตารางเรียน
        for (let slot = 0; slot < TOTAL_ROWS; slot++) {
            const rowNum = slot + 2;
            const isHourEnd = (slot % 2 === 1); 
            
            const totalMinutes = slot * 30;
            const hour = Math.floor(totalMinutes / 60) + START_HOUR;
            const minute = totalMinutes % 60;
            const timeVal = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

            for (let colNum = 2; colNum <= 8; colNum++) {
                const dayName = columnIndexToDay[colNum];
                const cell = document.createElement('div');
                cell.className = `grid-cell ${isHourEnd ? 'hour-line' : ''}`;
                cell.style.gridRow = `${rowNum}`;
                cell.style.gridColumn = `${colNum}`;
                cell.setAttribute('data-day', dayName); 
                
                cell.style.pointerEvents = 'auto'; 
                cell.style.cursor = 'pointer';
                cell.title = `คลิกเพื่อเพิ่มวิชาเรียนตรงกับ วัน${dayNamesTh[dayName]} เวลา ${timeVal} น.`;
                
                cell.addEventListener('click', () => {
                    openAddModalAt(dayName, timeVal);
                });

                grid.appendChild(cell);
            }
        }
    }

    // ดึงวิชาของตารางปัจจุบัน
    const activeSch = getActiveSchedule();
    const subjects = activeSch ? activeSch.subjects : [];

    // 4. วาดวิชาเรียนลงตามช่วงเวลาจริง
    if (subjects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'grid-empty-state';
        
        if (gridOrientation === 'horizontal') {
            emptyState.style.gridColumn = '2 / 26';
            emptyState.style.gridRow = '2 / 9';
        } else {
            emptyState.style.gridColumn = '2 / 9';
            emptyState.style.gridRow = '2 / 26';
        }

        emptyState.style.display = 'flex';
        emptyState.style.flexDirection = 'column';
        emptyState.style.justifyContent = 'center';
        emptyState.style.alignItems = 'center';
        emptyState.style.color = 'var(--text-muted)';
        emptyState.style.fontSize = '0.95rem';
        emptyState.style.padding = '40px';
        emptyState.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 12px; animation: float 3s ease-in-out infinite;">📅</div>
            <div style="font-weight: 500; margin-bottom: 15px;">ตารางเรียนนี้ยังว่างอยู่</div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="loadDemoTemplate()">💡 โหลดข้อมูลตารางตัวอย่าง</button>
                <button class="btn btn-secondary" onclick="openAddModal()">➕ เพิ่มวิชาใหม่</button>
            </div>
        `;
        grid.appendChild(emptyState);
        return;
    }

    subjects.forEach((sub, index) => {
        const card = createSubjectCard(sub, index);
        if (card) {
            grid.appendChild(card);
        }
    });
}

// สรุปรายวัน
function renderTodayView() {
    const todayList = document.getElementById('today-subjects-list');
    const todayTitle = document.getElementById('today-view-title');
    
    const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayNameEn = englishDays[new Date().getDay()];
    const currentDayNameTh = dayNamesTh[currentDayNameEn];
    
    todayTitle.innerHTML = `ตารางวิชาเรียนวันนี้ - ${currentDayNameTh} 🌤️`;
    todayList.innerHTML = '';

    const activeSch = getActiveSchedule();
    const subjects = activeSch ? activeSch.subjects : [];

    const todaySubjects = subjects
        .filter(sub => sub.day === currentDayNameEn)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todaySubjects.length === 0) {
        todayList.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-emoji">🎉</span>
                <p>วันนี้ไม่มีวิชาเรียนที่ระบุไว้ในระบบ</p>
            </div>
        `;
    } else {
        todaySubjects.forEach(sub => {
            const row = document.createElement('div');
            row.className = `today-subject-row`;
            row.style.borderLeft = `4px solid var(--subject-${sub.color}-border)`;
            row.style.backgroundColor = `var(--subject-${sub.color})`;
            row.style.color = `var(--subject-${sub.color}-dark)`;
            
            row.innerHTML = `
                <div class="today-time-col">${sub.startTime} - ${sub.endTime}</div>
                <div class="today-info-col">
                    <span class="today-subject-name">${sub.subjectCode} ${sub.subjectName}</span>
                    <span class="today-meta">
                        ${sub.room ? `📍 สถานที่: ${sub.room}` : ''} 
                        ${sub.teacher ? ` | 👩‍🏫 ผู้สอน: ${sub.teacher}` : ''}
                    </span>
                </div>
            `;
            todayList.appendChild(row);
        });
    }
}

// คำนวณตำแหน่งคอลัมน์ของ Grid จากเวลาจริง (HH:MM)
function timeToGridCol(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const clampedH = Math.max(START_HOUR, Math.min(END_HOUR, h));
    const minutesSinceStart = (clampedH - START_HOUR) * 60 + m;
    return Math.round(minutesSinceStart / 30) + 2;
}

// สร้างการ์ดแสดงรายวิชาในตาราง Grid
function createSubjectCard(sub, index) {
    const cardIndex = dayColumnIndices[sub.day];
    if (!cardIndex) return null;

    const startVal = timeToGridCol(sub.startTime);
    let endVal = timeToGridCol(sub.endTime);

    if (endVal <= startVal) {
        endVal = startVal + 1;
    }

    const card = document.createElement('div');
    card.className = `subject-card card-${sub.color}`;
    card.style.setProperty('--delay', index || 0);
    
    if (gridOrientation === 'horizontal') {
        card.style.gridRow = `${cardIndex}`;
        card.style.gridColumn = `${startVal} / ${endVal}`;
    } else {
        card.style.gridColumn = `${cardIndex}`;
        card.style.gridRow = `${startVal} / ${endVal}`;
    }
    
    card.setAttribute('data-id', sub.id);
    card.setAttribute('data-day', sub.day);

    // ตรวจสอบว่าตรงกับวันและเวลาเรียนปัจจุบันหรือไม่
    const now = new Date();
    const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayNameEn = englishDays[now.getDay()];
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTimeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
    
    const isActiveClass = (sub.day === currentDayNameEn && 
                           currentTimeStr >= sub.startTime && 
                           currentTimeStr <= sub.endTime);

    if (isActiveClass) {
        card.classList.add('active-now-card');
    }

    card.innerHTML = `
        <div class="card-header-row">
            <span class="card-time">${sub.startTime} - ${sub.endTime}</span>
            ${isActiveClass ? `<span class="active-pulse-badge" title="คาบเรียนที่กำลังดำเนินอยู่ขณะนี้"><span class="active-pulse-dot"></span>เรียนอยู่</span>` : ''}
            <span class="card-code-badge">${sub.subjectCode}</span>
        </div>
        <div class="card-name" title="${sub.subjectName}">${sub.subjectName}</div>
        <div class="card-details">
            ${sub.teacher ? `<span class="card-teacher" title="อาจารย์: ${sub.teacher}">👩‍🏫 ${sub.teacher}</span>` : ''}
            <span class="card-room" title="สถานที่: ${sub.room || 'ไม่ระบุห้องเรียน'}">📍 ${sub.room ? sub.room : 'ไม่ระบุห้องเรียน'}</span>
        </div>
        
        <div class="card-actions">
            <button class="btn-card-action btn-edit" title="แก้ไขข้อมูล">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="btn-card-action btn-delete" title="ลบวิชานี้">
                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
        </div>
    `;

    // ผูก Events
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(sub.id);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSubject(sub.id);
    });

    card.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(sub.id);
    });

    return card;
}

// ==========================================================================
// MODAL & FORM OPERATIONS
// ==========================================================================
const modal = document.getElementById('subject-modal');
const form = document.getElementById('subject-form');

function openAddModal() {
    form.reset();
    document.getElementById('subject-id').value = '';
    document.getElementById('modal-title').innerText = 'เพิ่มข้อมูลรายวิชาใหม่ 📝';
    
    const defaultColorInput = document.querySelector('input[name="subject-color"][value="indigo"]');
    if (defaultColorInput) defaultColorInput.checked = true;
    
    modal.classList.add('show');
}
window.openAddModal = openAddModal;

function openAddModalAt(day, startTime) {
    form.reset();
    document.getElementById('subject-id').value = '';
    document.getElementById('modal-title').innerText = `เพิ่มรายวิชาสำหรับวัน${dayNamesTh[day]} 📝`;
    
    document.getElementById('subject-day').value = day;
    document.getElementById('subject-start').value = startTime;
    
    const [h, m] = startTime.split(':').map(Number);
    const endHour = Math.min(END_HOUR, h + 2);
    document.getElementById('subject-end').value = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const defaultColorInput = document.querySelector('input[name="subject-color"][value="indigo"]');
    if (defaultColorInput) defaultColorInput.checked = true;
    
    modal.classList.add('show');
}

function openEditModal(id) {
    const activeSch = getActiveSchedule();
    const subjects = activeSch ? activeSch.subjects : [];
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;

    document.getElementById('subject-id').value = sub.id;
    document.getElementById('subject-code').value = sub.subjectCode;
    document.getElementById('subject-name').value = sub.subjectName;
    document.getElementById('subject-teacher').value = sub.teacher || '';
    document.getElementById('subject-day').value = sub.day;
    document.getElementById('subject-start').value = sub.startTime;
    document.getElementById('subject-end').value = sub.endTime;
    document.getElementById('subject-room').value = sub.room || '';
    
    const targetColor = colorMap[sub.color] || 'indigo';
    const colorRadio = document.querySelector(`input[name="subject-color"][value="${targetColor}"]`);
    if (colorRadio) colorRadio.checked = true;

    document.getElementById('modal-title').innerText = 'แก้ไขรายละเอียดรายวิชา ✏️';
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}

function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('subject-id').value;
    const subjectCode = document.getElementById('subject-code').value.trim();
    const subjectName = document.getElementById('subject-name').value.trim();
    const teacher = document.getElementById('subject-teacher').value.trim();
    const day = document.getElementById('subject-day').value;
    const startTime = document.getElementById('subject-start').value;

    const endTime = document.getElementById('subject-end').value;
    const room = document.getElementById('subject-room').value.trim();
    const colorInput = document.querySelector('input[name="subject-color"]:checked');
    const color = colorInput ? colorInput.value : 'indigo';

    const activeSch = getActiveSchedule();
    if (!activeSch) return;

    const subjectData = {
        id: id || 'sub_' + Date.now(),
        subjectCode,
        subjectName,
        teacher,
        day,
        startTime,
        endTime,
        room,
        color
    };

    if (id) {
        // แก้ไข
        const index = activeSch.subjects.findIndex(s => s.id === id);
        if (index !== -1) {
            activeSch.subjects[index] = subjectData;
            showToast('✏️ แก้ไขข้อมูลรายวิชาเรียบร้อยแล้ว');
        }
    } else {
        // เพิ่มใหม่
        activeSch.subjects.push(subjectData);
        showToast('✅ เพิ่มข้อมูลรายวิชาใหม่เรียบร้อยแล้ว');
    }

    saveSchedules();
    closeModal();
    render();
}

function renameSchedule() {
    const activeSch = getActiveSchedule();
    if (!activeSch) return;

    const newName = prompt('เปลี่ยนชื่อตารางเรียน:', activeSch.name);
    if (!newName || !newName.trim() || newName.trim() === activeSch.name) return;

    const oldName = activeSch.name;
    activeSch.name = newName.trim();

    saveSchedules();
    updateScheduleDropdown();
    showToast(`✏️ เปลี่ยนชื่อตารางเรียน "${oldName}" เป็น "${activeSch.name}" สำเร็จ!`);
}

function deleteSchedule() {
    if (schedules.length <= 1) {
        showToast('⚠️ ไม่สามารถลบได้ เนื่องจากระบบต้องการมีตารางเรียนอย่างน้อย 1 ตาราง');
        return;
    }

    const activeSch = getActiveSchedule();
    if (!activeSch) return;

    if (confirm(`คุณต้องการลบตารางเรียน "${activeSch.name}" ใช่หรือไม่? \n(ข้อมูลรายวิชาเรียนทั้งหมดในตารางนี้จะถูกลบออกถาวร!)`)) {
        const deletedIndex = schedules.findIndex(s => s.id === activeScheduleId);
        const deletedSch = schedules[deletedIndex];

        // ลบออกจากรายการ
        schedules.splice(deletedIndex, 1);
        
        // สลับไปยังตารางเรียนแรกในรายการ
        activeScheduleId = schedules[0].id;

        saveSchedules();
        updateScheduleDropdown();
        render();

        showToast(`🗑️ ลบตารางเรียน "${deletedSch.name}" เรียบร้อยแล้ว`);
    }
}

// ==========================================================================
// IMAGE EXPORT & TEMPLATE MANAGEMENT
// ==========================================================================
function saveAsImage() {
    const captureArea = document.getElementById('timetable-capture-area');
    const timetable = document.getElementById('timetable-weekly-grid');
    const wrapper = document.querySelector('.timetable-wrapper');
    if (!captureArea || !timetable || !wrapper) return;

    showToast('📸 กำลังประมวลผลรูปภาพตารางเรียนพรีเมียม (กรุณารอสักครู่)...');
    
    // ตั้งค่าหัวกระดาษและวันที่อัปเดตข้อมูลส่งออก
    const activeSch = getActiveSchedule();
    const exportName = document.getElementById('export-schedule-name');
    if (exportName) exportName.innerText = activeSch ? activeSch.name : 'ตารางเรียน';
    
    const exportTime = document.getElementById('export-schedule-timestamp');
    if (exportTime) {
        const exportOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        exportTime.innerText = `บันทึกเมื่อวันที่ ${new Date().toLocaleDateString('th-TH', exportOptions)} น.`;
    }

    // ล็อกขนาดกว้างสำหรับจับภาพให้แสดงผลแบบเดสก์ท็อปคมชัดและเต็มตารางพอดีตามแนวตั้ง/แนวนอน
    const originalWidth = captureArea.style.width;
    const originalMaxWidth = captureArea.style.maxWidth;
    const originalPosition = captureArea.style.position;
    const originalZIndex = captureArea.style.zIndex;
    
    const originalWrapperWidth = wrapper.style.width;
    const originalWrapperMaxWidth = wrapper.style.maxWidth;
    const originalWrapperOverflow = wrapper.style.overflow;
    const originalWrapperMaxHeight = wrapper.style.maxHeight;

    const captureWidthNum = gridOrientation === 'horizontal' ? 1700 : 1320;
    const captureWidth = `${captureWidthNum}px`;

    // เปิดโหมดเซฟรูปภาพและบังคับสไตล์
    document.body.classList.add('is-capturing');
    captureArea.classList.add('is-capturing');
    
    captureArea.style.width = captureWidth;
    captureArea.style.maxWidth = captureWidth;
    wrapper.style.width = captureWidth;
    wrapper.style.maxWidth = captureWidth;
    wrapper.style.overflow = 'visible';
    wrapper.style.maxHeight = 'none';

    // ซ่อนหัวข้อสลับวันของมือถือชั่วคราว
    const mobileTabs = document.getElementById('mobile-day-tabs');
    const originalMobileTabsDisplay = mobileTabs ? mobileTabs.style.display : '';
    if (mobileTabs) mobileTabs.style.display = 'none';

    // จัดเรียงตารางใหม่ให้ครบถ้วนทุกวัน
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        timetable.removeAttribute('data-active-day');
    }

    // บังคับวาดตารางใหม่เต็มสัปดาห์ในพิกัดเดสก์ท็อปเพื่อความตรงและถูกต้อง
    renderWeeklyGrid();

    // รอเวลาย่อยให้เบราว์เซอร์จัดเรียง Layout และ Repaint ใหม่ก่อนแคปภาพ
    setTimeout(() => {
        const options = {
            scale: 3.0, // เพิ่มความละเอียดเป็น 3 เท่า คมชัดมาก ตัวหนังสือไม่เบลอ
            useCORS: true,
            backgroundColor: null, // ปล่อยให้แสดงพื้นหลังแบบ Gradient ตามดีไซน์จริงแทนที่จะระบายสีขาวทับ
            logging: false,
            windowWidth: captureWidthNum,
            width: captureWidthNum
        };

        html2canvas(captureArea, options).then(canvas => {
            try {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        showToast('⚠️ ไม่สามารถแปลงข้อมูลภาพได้');
                        return;
                    }
                    const blobUrl = URL.createObjectURL(blob);
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.href = blobUrl;
                    
                    const schName = activeSch ? activeSch.name.replace(/[^a-zA-Z0-9ก-๙_]/g, '') : 'schedule';
                    const dateStr = new Date().toISOString().split('T')[0];
                    
                    downloadAnchor.download = `${schName}_${dateStr}.png`;
                    
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    
                    setTimeout(() => {
                        downloadAnchor.remove();
                        URL.revokeObjectURL(blobUrl);
                    }, 150);
                    
                    showToast('✅ บันทึกตารางเรียนเป็นรูปภาพ PNG เรียบร้อยแล้ว!');
                }, 'image/png');

            } catch (err) {
                console.error('Error rendering image:', err);
                showToast('⚠️ เกิดข้อผิดพลาดในการบันทึกรูปภาพ');
            }
            
            // คืนค่าทั้งหมดกลับมาปกติ
            cleanupCapture();
        }).catch(err => {
            console.error('Error rendering canvas:', err);
            showToast('⚠️ ไม่สามารถแปลงข้อมูลเป็นรูปภาพได้');
            cleanupCapture();
        });
    }, 200); // ดีเลย์ 200ms เพื่อให้แน่ใจว่าเบราว์เซอร์ทำ reflow ครบถ้วน

    function cleanupCapture() {
        document.body.classList.remove('is-capturing');
        captureArea.classList.remove('is-capturing');
        
        captureArea.style.width = originalWidth;
        captureArea.style.maxWidth = originalMaxWidth;
        captureArea.style.position = originalPosition;
        captureArea.style.zIndex = originalZIndex;
        
        wrapper.style.width = originalWrapperWidth;
        wrapper.style.maxWidth = originalWrapperMaxWidth;
        wrapper.style.overflow = originalWrapperOverflow;
        wrapper.style.maxHeight = originalWrapperMaxHeight;
        
        if (mobileTabs) mobileTabs.style.display = originalMobileTabsDisplay;

        if (isMobile) {
            timetable.setAttribute('data-active-day', activeMobileDay);
        }
        render();
    }
}

// โหลดตารางตัวอย่างลงตารางปัจจุบัน
function loadDemoTemplate() {
    if (confirm('คุณต้องการโหลดตารางเรียนวิชาเรียนของภาคการศึกษา 1/2569 ใช่หรือไม่? (การโหลดข้อมูลตัวอย่างจะทับข้อมูลเดิมทั้งหมดในตารางปัจจุบันของคุณ)')) {
        const activeSch = getActiveSchedule();
        if (!activeSch) return;

        activeSch.subjects = [
            {
                id: 'demo_1_2569_1',
                subjectCode: '308-421',
                subjectName: 'การประยุกต์เทคโนโลยีสารสนเทศและการสื่อสารเพื่องานอาชีพ',
                teacher: 'เถกิง วงศ์ศิริโชติ',
                day: 'Friday',
                startTime: '08:00',
                endTime: '09:50',
                room: 'BSc0409(LAB)',
                color: 'indigo'
            },
            {
                id: 'demo_1_2569_2',
                subjectCode: '308-325',
                subjectName: 'โครงงานทางเทคโนโลยีสารสนเทศและการสื่อสาร 2',
                teacher: 'น้ำทิพย์ ตระกูลเมฆี',
                day: 'Thursday',
                startTime: '15:00',
                endTime: '18:50',
                room: 'BSc0503/1',
                color: 'coral'
            },
            {
                id: 'demo_1_2569_3',
                subjectCode: '308-493',
                subjectName: 'ชุดวิชาแอปพลิเคชันบนอุปกรณ์พกพา แบบข้ามแพลตฟอร์มและการประยุกต์',
                teacher: 'สุขกมล สุขพิศิษฐ์',
                day: 'Monday',
                startTime: '13:00',
                endTime: '16:50',
                room: 'BSc0409(LAB)',
                color: 'emerald'
            },
            {
                id: 'demo_1_2569_4',
                subjectCode: '308-493',
                subjectName: 'ชุดวิชาแอปพลิเคชันบนอุปกรณ์พกพา แบบข้ามแพลตฟอร์มและการประยุกต์',
                teacher: 'สุขกมล สุขพิศิษฐ์',
                day: 'Wednesday',
                startTime: '13:00',
                endTime: '16:50',
                room: 'BSc0409(LAB)',
                color: 'emerald'
            },
            {
                id: 'demo_1_2569_5',
                subjectCode: '308-493',
                subjectName: 'ชุดวิชาแอปพลิเคชันบนอุปกรณ์พกพา แบบข้ามแพลตฟอร์มและการประยุกต์',
                teacher: 'สุขกมล สุขพิศิษฐ์',
                day: 'Friday',
                startTime: '15:00',
                endTime: '16:50',
                room: 'BSc0408(LAB)',
                color: 'emerald'
            }
        ];
        saveSchedules();
        render();
        showToast('💡 โหลดวิชาเรียนภาคการศึกษา 1/2569 เรียบร้อยแล้ว!');
    }
}

// ==========================================================================
// IMPORT & EXPORT SYSTEM (JSON)
// ==========================================================================
function exportBackup() {
    const activeSch = getActiveSchedule();
    if (!activeSch || activeSch.subjects.length === 0) {
        showToast('⚠️ ไม่มีข้อมูลตารางเรียนที่สามารถดาวน์โหลดได้');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeSch.subjects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const schName = activeSch.name.replace(/[^a-zA-Z0-9ก-๙_]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `${schName}_data_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    showToast('💾 ส่งออกข้อมูล JSON สำเร็จแล้ว');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                const activeSch = getActiveSchedule();
                if (activeSch) {
                    activeSch.subjects = importedData.map(sub => ({
                        ...sub,
                        color: colorMap[sub.color] || 'indigo'
                    }));
                    saveSchedules();
                    render();
                    showToast('📂 นำเข้าข้อมูลตารางเรียนสำเร็จแล้ว!');
                }
            } else {
                showToast('⚠️ ข้อมูลในไฟล์ไม่สามารถนำเข้าได้');
            }
        } catch (error) {
            showToast('⚠️ ไฟล์ไม่อยู่ในฟอร์แมต JSON ที่ถูกต้อง');
            console.error(error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
window.loadDemoTemplate = loadDemoTemplate;


function createSchedule() {
    const name = prompt('กรุณากรอกชื่อตารางเรียนใหม่:');
    if (!name || !name.trim()) return;

    const newSch = {
        id: 'sch_' + Date.now(),
        name: name.trim(),
        subjects: []
    };

    schedules.push(newSch);
    activeScheduleId = newSch.id;

    saveSchedules();
    updateScheduleDropdown();
    render();
    showToast(`📂 สร้างและเปิดตารางเรียนใหม่ "${newSch.name}" สำเร็จ!`);
}

function deleteSubject(id) {
    const activeSch = getActiveSchedule();
    if (!activeSch) return;

    const index = activeSch.subjects.findIndex(s => s.id === id);
    if (index !== -1) {
        if (confirm('คุณต้องการลบรายวิชานี้ใช่หรือไม่?')) {
            lastDeletedSubject = activeSch.subjects[index];
            lastDeletedSchedule = null;
            activeSch.subjects.splice(index, 1);
            saveSchedules();
            render();
            showUndoToast(`🗑️ ลบรายวิชา "${lastDeletedSubject.subjectName}" เรียบร้อยแล้ว`);
        }
    }
}

function undoDelete() {
    if (lastDeletedSubject) {
        const activeSch = getActiveSchedule();
        if (activeSch) {
            activeSch.subjects.push(lastDeletedSubject);
            lastDeletedSubject = null;
            saveSchedules();
            render();
            showToast('✅ กู้คืนข้อมูลรายวิชาเรียบร้อยแล้ว');
        }
    } else if (lastDeletedSchedule) {
        schedules.push(lastDeletedSchedule);
        activeScheduleId = lastDeletedSchedule.id;
        lastDeletedSchedule = null;
        saveSchedules();
        updateScheduleDropdown();
        render();
        showToast('✅ กู้คืนตารางเรียนเรียบร้อยแล้ว');
    }
    const toast = document.getElementById('toast');
    if (toast) toast.className = 'toast';
}
window.undoDelete = undoDelete;

function setupEventListeners() {
    document.getElementById('btn-add-subject').addEventListener('click', openAddModal);
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    form.addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-save-image').addEventListener('click', saveAsImage);
    document.getElementById('btn-load-template').addEventListener('click', loadDemoTemplate);
    document.getElementById('btn-export').addEventListener('click', exportBackup);
    
    const importTrigger = document.getElementById('btn-import-trigger');
    const fileImportInput = document.getElementById('file-import');
    
    importTrigger.addEventListener('click', () => {
        fileImportInput.click();
    });
    
    fileImportInput.addEventListener('change', handleImport);

    // ช่วยเหลือการพิมพ์ (Auto-endtime Generator)
    document.getElementById('subject-start').addEventListener('change', (e) => {
        const startTime = e.target.value;
        if (startTime) {
            const [h, m] = startTime.split(':').map(Number);
            const endHour = Math.min(END_HOUR, h + 2);
            document.getElementById('subject-end').value = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
    });

    // ตั้งค่าปุ่มเลือกวันบนมือถือ
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            activeMobileDay = e.target.getAttribute('data-day');
            
            const grid = document.getElementById('timetable-weekly-grid');
            if (grid) {
                grid.setAttribute('data-active-day', activeMobileDay);
            }
            renderWeeklyGrid();
        });
    });

    // ตั้งค่าตัวเลือกตารางเรียนใน Dropdown
    document.getElementById('schedule-select').addEventListener('change', (e) => {
        activeScheduleId = e.target.value;
        saveSchedules();
        render();
        showToast('📂 เปิดแฟ้มตารางเรียนเรียบร้อยแล้ว');
    });

    // ปุ่มควบคุมรายแฟ้มตารางเรียน
    document.getElementById('btn-create-schedule').addEventListener('click', createSchedule);
    document.getElementById('btn-rename-schedule').addEventListener('click', renameSchedule);
    document.getElementById('btn-delete-schedule').addEventListener('click', deleteSchedule);
    
    // ปุ่มสลับแนวตั้ง/แนวนอน
    document.getElementById('btn-toggle-orientation').addEventListener('click', toggleGridOrientation);

    // เปิดใช้งานการคลิกลากเพื่อขยับเลื่อนตาราง (Drag-to-Scroll)
    setupDragToScroll();
    setupTouchSwipe();
}

function setupDragToScroll() {
    const slider = document.querySelector('.timetable-wrapper');
    if (!slider) return;

    let isDown = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    slider.style.cursor = 'grab';

    slider.addEventListener('mousedown', (e) => {
        // ให้แน่ใจว่าไม่ได้คลิกโดนปุ่ม action หรือลิงก์ที่ต้องการกดปกติ
        if (e.target.closest('.subject-card') || e.target.closest('.btn') || e.target.closest('button')) {
            return;
        }
        isDown = true;
        slider.style.cursor = 'grabbing';
        slider.style.userSelect = 'none';
        
        startX = e.pageX - slider.offsetLeft;
        startY = e.pageY - slider.offsetTop;
        scrollLeft = slider.scrollLeft;
        scrollTop = slider.scrollTop;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.removeProperty('user-select');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.removeProperty('user-select');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.pageX - slider.offsetLeft;
        const y = e.pageY - slider.offsetTop;
        const walkX = (x - startX) * 1.5; // ความเร็วในการเลื่อนตามเมาส์
        const walkY = (y - startY) * 1.5;
        
        slider.scrollLeft = scrollLeft - walkX;
        slider.scrollTop = scrollTop - walkY;
    });
}

function setupTouchSwipe() {
    const slider = document.querySelector('.timetable-wrapper');
    if (!slider) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Check if swipe is horizontal and meets threshold
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) return;

            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            let currentIndex = days.indexOf(activeMobileDay);
            
            if (diffX < 0) {
                // Swipe left -> Next day
                currentIndex = (currentIndex + 1) % days.length;
            } else {
                // Swipe right -> Previous day
                currentIndex = (currentIndex - 1 + days.length) % days.length;
            }
            
            const targetDay = days[currentIndex];
            const targetTab = document.querySelector(`.day-tab[data-day="${targetDay}"]`);
            if (targetTab) {
                targetTab.click();
            }
        }
    }
}

function updateClock() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('th-TH', dateOptions);
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const displayDiv = document.getElementById('current-datetime');
    if (displayDiv) {
        displayDiv.innerHTML = `<span>🕒 ${dateStr} | ${timeStr} น.</span>`;
    }

    // เอาเส้นสีแดงออกตามที่ขอ
    const oldInd = document.getElementById('current-time-indicator');
    if (oldInd) oldInd.remove();

    // อัปเดตสถานะวิชาเรียนแบบเรียลไทม์ทุกวินาที
    updateActiveCards();
}

// อัปเดตสถานะขอบกะพริบเรืองแสงและป้าย "เรียนอยู่" แบบเรียลไทม์
function updateActiveCards() {
    const now = new Date();
    const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayNameEn = englishDays[now.getDay()];
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTimeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
    
    const activeSch = getActiveSchedule();
    const subjects = activeSch ? activeSch.subjects : [];
    
    document.querySelectorAll('.subject-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const sub = subjects.find(s => s.id === id);
        if (!sub) return;
        
        const isActiveClass = (sub.day === currentDayNameEn && 
                               currentTimeStr >= sub.startTime && 
                               currentTimeStr <= sub.endTime);
                               
        const currentlyHasActive = card.classList.contains('active-now-card');
        
        if (isActiveClass && !currentlyHasActive) {
            card.classList.add('active-now-card');
            
            const headerRow = card.querySelector('.card-header-row');
            if (headerRow && !headerRow.querySelector('.active-pulse-badge')) {
                const badge = document.createElement('span');
                badge.className = 'active-pulse-badge';
                badge.title = 'คาบเรียนที่กำลังดำเนินอยู่ขณะนี้';
                badge.innerHTML = '<span class="active-pulse-dot"></span>เรียนอยู่';
                
                const timeSpan = headerRow.querySelector('.card-time');
                if (timeSpan) {
                    timeSpan.insertAdjacentElement('afterend', badge);
                } else {
                    headerRow.appendChild(badge);
                }
            }
        } else if (!isActiveClass && currentlyHasActive) {
            card.classList.remove('active-now-card');
            const badge = card.querySelector('.active-pulse-badge');
            if (badge) badge.remove();
        }
    });
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = message;
    
    // Reset classes and apply type
    toast.className = 'toast';
    let extraClass = '';
    if (type === 'offline') extraClass = ' toast-offline';
    else if (type === 'online') extraClass = ' toast-online';
    
    toast.className = 'toast show' + extraClass;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, type ? 4000 : 3000);
}


function showUndoToast(message) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="undoDelete()" style="background: var(--primary); border: none; color: white; padding: 4px 10px; border-radius: 4px; font-family: inherit; font-size: 0.8rem; cursor: pointer; font-weight: 500; transition: var(--transition-smooth);">
                กู้คืน (Undo)
            </button>
        </div>
    `;
    toast.className = 'toast show';
    
    setTimeout(() => {
        if (toast.innerHTML.includes('undoDelete')) {
            toast.className = 'toast';
        }
    }, 5000);
}

// สลับทิศทางแนวตั้ง/แนวนอน
function toggleGridOrientation() {
    gridOrientation = (gridOrientation === 'horizontal') ? 'vertical' : 'horizontal';
    localStorage.setItem('my_grid_orientation', gridOrientation);
    render();
    showToast(`🔄 สลับตารางเรียนเป็นแนว${gridOrientation === 'horizontal' ? 'นอน' : 'ตั้ง'} เรียบร้อยแล้ว`);
}

// อัปเดตพิกัดตำแหน่งของเส้นบอกเวลาปัจจุบันอัจฉริยะแบบเรียลไทม์
function updateTimeIndicator() {
    // เอาความสามารถของเส้นระบุเวลาออกตามความต้องการของผู้ใช้
    const oldInd = document.getElementById('current-time-indicator');
    if (oldInd) oldInd.remove();
}

// ลงทะเบียน Service Worker เพื่อรองรับการทำ PWA (Add to Home Screen) บน iPad
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// ==========================================================================
// PREMIUM VISUAL CUSTOMIZER CONTROLLER
// ==========================================================================
function initCustomizer() {
    const drawer = document.getElementById('customizer-drawer');
    const btnOpen = document.getElementById('btn-open-customizer');
    const btnClose = document.getElementById('btn-close-customizer');
    
    if (!drawer || !btnOpen || !btnClose) return;

    // 1. Open/Close Drawer
    btnOpen.addEventListener('click', () => drawer.classList.add('open'));
    btnClose.addEventListener('click', () => drawer.classList.remove('open'));

    // Close when clicking outside of drawer content
    window.addEventListener('click', (e) => {
        if (drawer.classList.contains('open') && 
            !drawer.contains(e.target) && 
            e.target !== btnOpen && 
            !btnOpen.contains(e.target)) {
            drawer.classList.remove('open');
        }
    });

    // Clean up any legacy theme classes if they exist
    document.body.classList.remove('theme-dark-glass', 'theme-cyberpunk', 'theme-minimal');


    // 3. Font Family Selection
    const fontSelect = document.getElementById('font-select');
    const currentFont = localStorage.getItem('my_custom_font') || 'font-kanit';
    
    if (fontSelect) {
        fontSelect.value = currentFont;
        fontSelect.addEventListener('change', (e) => {
            applyFont(e.target.value);
        });
    }

    function applyFont(fontClass) {
        document.body.classList.remove('font-kanit', 'font-sarabun', 'font-chonburi', 'font-mitr');
        document.body.classList.add(fontClass);
        localStorage.setItem('my_custom_font', fontClass);
    }
    
    applyFont(currentFont);

    // 4. Aurora Speed Slider
    const speedSlider = document.getElementById('aurora-speed-slider');
    const speedVal = document.getElementById('aurora-speed-val');
    const initialSpeed = localStorage.getItem('my_aurora_speed') || '30';

    if (speedSlider && speedVal) {
        speedSlider.value = initialSpeed;
        speedVal.innerText = initialSpeed === '0' ? 'Static' : initialSpeed + 's';
        
        speedSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            speedVal.innerText = val === '0' ? 'Static' : val + 's';
            applyAuroraSpeed(val);
        });
    }

    function applyAuroraSpeed(speedSec) {
        const blobs = document.querySelectorAll('.aurora-blob');
        blobs.forEach((blob, index) => {
            if (speedSec === '0') {
                blob.style.animation = 'none';
            } else {
                // Keep original base speeds but scale them based on user preference
                let factor = 1.0;
                if (index === 0) factor = 25 / 30;
                else if (index === 1) factor = 30 / 30;
                else if (index === 2) factor = 28 / 30;
                
                const calculatedSpeed = Math.round(Number(speedSec) * factor);
                blob.style.animation = `drift-${index + 1} ${calculatedSpeed}s infinite alternate ease-in-out`;
            }
        });
        localStorage.setItem('my_aurora_speed', speedSec);
    }
    
    applyAuroraSpeed(initialSpeed);

    // 5. Custom Background Image Upload
    const btnUploadTrigger = document.getElementById('btn-upload-bg-trigger');
    const fileInput = document.getElementById('bg-image-upload');
    const btnReset = document.getElementById('btn-reset-bg');
    const savedBg = localStorage.getItem('my_custom_bg_base64');

    if (btnUploadTrigger && fileInput) {
        btnUploadTrigger.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check size (keep Base64 under ~4MB to avoid localStorage limits)
            if (file.size > 4 * 1024 * 1024) {
                showToast('⚠️ ขนาดรูปภาพใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 4MB)');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                applyCustomBg(base64);
                showToast('🖼️ อัปโหลดและติดตั้งภาพพื้นหลังใหม่แล้ว');
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            document.body.style.removeProperty('--custom-bg-url');
            document.body.classList.remove('has-custom-bg');
            btnReset.style.display = 'none';
            localStorage.removeItem('my_custom_bg_base64');
            showToast('🗑️ รีเซ็ตภาพพื้นหลังเป็นออริจินัลแล้ว');
        });
    }

    function applyCustomBg(base64) {
        if (!base64) return;
        document.body.style.setProperty('--custom-bg-url', `url(${base64})`);
        document.body.classList.add('has-custom-bg');
        if (btnReset) btnReset.style.display = 'block';
        localStorage.setItem('my_custom_bg_base64', base64);
    }

    if (savedBg) {
        applyCustomBg(savedBg);
    }
}

function setupOnlineStatusMonitor() {
    const offlineBadge = document.getElementById('offline-badge');
    
    function updateStatus() {
        if (navigator.onLine) {
            if (offlineBadge) offlineBadge.style.display = 'none';
        } else {
            if (offlineBadge) offlineBadge.style.display = 'inline-flex';
        }
    }

    window.addEventListener('online', () => {
        updateStatus();
        showToast('📶 เชื่อมต่ออินเทอร์เน็ตแล้ว - ตารางเรียนเข้าสู่โหมดออนไลน์', 'online');
    });

    window.addEventListener('offline', () => {
        updateStatus();
        showToast('📡 ขาดการเชื่อมต่อ - กำลังใช้ข้อมูลตารางเรียนแบบออฟไลน์', 'offline');
    });

    // Run initial check
    updateStatus();
}


