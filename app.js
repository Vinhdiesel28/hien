'use strict';

const main = document.querySelector('main');
const footer = document.querySelector('footer');
const titlebar = document.querySelector('#titlebar');
const dialog = document.querySelector('dialog');
const toast = document.querySelector('#toast');
const storageKey = 'hien-mau-github-pages-demo-2.4.13';
const tabs = [
  ['home', 'Trang chủ'], ['history', 'Lịch sử'], ['qr', 'Mã QR'],
  ['notifications', 'Thông báo'], ['settings', 'Cài đặt']
];
const shortcuts = [
  ['booking', 'Đặt lịch', 'calendar', '#5856D6', 30],
  ['places', 'Địa điểm', 'map', '#FFCC00', 35],
  ['hospitals', 'Bệnh viện', 'hospital', '#FF9500', 35],
  ['groups', 'Nhóm', 'group', '#5ECBF6', 25],
  ['friends', 'Bạn bè', 'friend', '#4CD964', 25],
  ['contact', 'Liên hệ', 'contact', '#FF3B30', 25],
  ['benefits', 'Ưu đãi', 'api', '#8601AF', 25],
  ['faq', 'Hỏi đáp', 'headset', '#B2D732', 25]
];
const profile = {
  name: 'Người hiến máu', dob: '', identity: '', gender: 'Nam', phone: '', email: '',
  student: '', job: 'Học sinh - Sinh viên', workplace: '',
  permanentCity: 'TP Hà Nội', permanentDistrict: '', permanentWard: '', permanentStreet: '',
  contactCity: 'TP Hà Nội', contactDistrict: '', contactWard: '', contactStreet: '',
  same: false, avatar: ''
};
const sampleNotification = {
  id: 'sample', title: 'Thông báo đặt lịch hiến máu',
  message: 'Cảm ơn Bạn đã đăng ký hiến máu ngày 11/10/2026 tại Phường Kiến Hưng, thành phố Hà Nội.',
  time: '09/10/2026, 6:26:13 ch', read: false
};
const initialState = () => ({
  profile: { ...profile }, appointments: [], notifications: [{ ...sampleNotification }],
  friends: [], group: false, signedOut: false
});
const donations = [{
  date: '11/10/2026',
  volume: 350,
  journey: [
    { label: 'Lưu trữ tại Trung tâm Máu Quốc gia', date: '12/10/2026' },
    { label: 'Đơn vị máu được sử dụng cho bệnh nhân tại Bệnh viện Đa khoa tỉnh Yên Bái', date: '23/10/2026' }
  ]
}];
const center = 'Trung tâm Máu Quốc gia';
const site = 'Viện Huyết học - Truyền máu TW, Phạm Văn Bạch, Yên Hòa, Cầu Giấy, Hà Nội';
const locationNames = ['Trung tâm Máu Quốc gia', 'Điểm hiến máu Kiến Hưng', 'Điểm hiến máu Hoàn Kiếm'];
const campaigns = [
  ['teachers.jpg','Chúc mừng Ngày Nhà giáo Việt Nam 20/11/2026'],
  ['news-donation.jpg','Ngày hội hiến máu'],
  ['news-group.jpg','Gặp mặt người hiến máu']
];
const articles = [
  ['news-donation.jpg','Ngày hội hiến máu','Hình ảnh hoạt động hiến máu trong bộ ảnh tham chiếu.'],
  ['news-group.jpg','Gặp mặt người hiến máu có nhóm máu hiếm','Hình ảnh chương trình gặp mặt cộng đồng người hiến máu.']
];
const icon = name => `<svg class="ipa-icon icon-${name}" viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true"><path d="${ipaIconPaths[name]}"/></svg>`;
const escape = text => String(text ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const asset = (name, alt = '', attributes = '') => `<img src="assets/${name}" alt="${escape(alt)}" ${attributes}>`;
const button = (title, action, style = '') => `<button type="button" class="${style}" data-action="${action}">${title}</button>`;

let state = initialState();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved) state = { ...state, ...saved, profile: { ...profile, ...saved.profile } };
} catch {
  // Some browsers restrict storage for file URLs.
}
let storageAvailable = true;
let draft = null;
let segment = 0;
let toastTimer;
let bookingLocation = locationNames[0];
const currentRoute = () => location.hash.slice(1) || 'home';
function openRoute(route) {
  if (currentRoute() === route) render();
  else location.hash = route;
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); }
  catch { storageAvailable = false; }
}
function notify(text) {
  toast.textContent = storageAvailable ? text : `${text} Dữ liệu chỉ lưu trong phiên này.`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
}
function modal(title, body, actions = '') {
  dialog.innerHTML = `<h2 id="dialog-title">${escape(title)}</h2><div>${body}</div><div class="dialog-actions">${actions}${button('Đóng','close')}</div>`;
  if (!dialog.open) dialog.showModal();
}
function qrPage() {
  return `<section class="qr-screen">
    <div class="qr-display"><figure>
      ${asset('qr.png','Mã QR của bạn','width="360" height="360"')}
      <figcaption>Mã QR của bạn</figcaption>
    </figure></div>
    ${button('Quét mã QR để kết nối','scan-qr','primary qr-scan')}
  </section>`;
}
async function readQrImage(input) {
  const file = input.files[0];
  if (!file) return;
  const result = dialog.querySelector('#qr-result');
  const url = URL.createObjectURL(file);
  result.textContent = 'Đang đọc mã QR...';
  input.disabled = true;
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1500 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(pixels.data, pixels.width, pixels.height);
    result.textContent = code ? code.data : 'Không tìm thấy mã QR. Hãy chọn ảnh rõ hơn.';
  } catch {
    result.textContent = 'Không đọc được ảnh. Hãy thử chọn ảnh khác.';
  } finally {
    URL.revokeObjectURL(url);
    input.disabled = false;
    input.value = '';
  }
}
function masthead(title, back = '', qr = false) {
  titlebar.innerHTML = `${back ? `<a class="back" href="#${back}" aria-label="Quay lại">${icon('back')}</a>` : ''}
    <h1>${title}</h1>${qr ? `<a class="head-action" href="#qr" aria-label="Mã QR">${asset('scan_qr.png')}</a>` : ''}`;
}
function navigation(selected) {
  return `<nav class="tabbar" aria-label="Điều hướng chính">
    ${tabs.map(([id, label]) => `<a href="#${id}"${id === selected ? ' aria-current="page"' : ''}>${icon('tab-'+id)}<span>${label}</span></a>`).join('')}</nav>`;
}
const submitFooter = (label, form) => `<div class="bottom-action"><button class="primary" type="submit" form="${form}">${label}</button></div>`;
const avatarUrl = () => state.profile.avatar || 'assets/default_avatar.png';
const avatarImage = () => `<img src="${escape(avatarUrl())}" alt="">`;
const dateDisplay = iso => iso.split('-').reverse().join('/');
function localDate() {
  const now = new Date();
  return new Date(now.valueOf() - now.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function articlesHtml() {
  return articles.map(([image,title],index) => `<button class="news-card" type="button" data-action="article/${index}">${asset(image)}<strong>${title}</strong></button>`).join('');
}
function home(countdown = false) {
  const appointment = [...state.appointments].filter(item=>item.date>=localDate()).sort((a,b)=>a.date.localeCompare(b.date))[0];
  return `<section class="hero" aria-label="Hồ sơ người hiến máu">
    <p class="greeting">Xin chào, <strong>${escape(state.profile.name)}</strong></p>
    <p class="eligibility">${countdown ? 'Hẹn gặp bạn vào ngày&nbsp; 68 ngày 00 giờ' : appointment ? `Hẹn gặp bạn vào ngày ${dateDisplay(appointment.date)}` : 'Quý vị đã đủ điều kiện hiến máu.'}</p>
    <div class="summary">
      <div class="stat"><strong>${countdown?'O Rh(+)':'---'}</strong><span>Nhóm máu</span></div>
      <a class="hero-avatar" href="#settings" aria-label="Thông tin tài khoản">${countdown?asset('default_avatar.png'):avatarImage()}</a>
      <a class="stat" href="#history"><strong>${donations.length}</strong><span>Lần hiến máu</span></a>
    </div>
  </section>
  <nav class="shortcuts" aria-label="Tiện ích">${shortcuts.map(([route,label,symbol,color,size]) =>
    `<a href="#${route}"><span class="shortcut-icon" style="--tile-color:${color};--tile-icon:${size}px">${icon(symbol)}</span><span>${label}</span></a>`).join('')}</nav>
  <section class="carousel" aria-label="Nội dung nổi bật">
    <div class="slides">${campaigns.map(([image,title])=>asset(image,title,'class="slide"')).join('')}</div>
    <div class="carousel-dots">${campaigns.map(([,title],index)=>`<button type="button" aria-label="${title}" aria-pressed="${index===0}" data-action="slide/${index}"></button>`).join('')}</div>
  </section>
  <section><div class="news-heading"><h2>Tin tức</h2><a href="#news">Tất cả</a></div><div class="news">${articlesHtml()}</div></section>`;
}
function history() {
  return `<div class="history">${donations.map(({date,volume},index)=>{
    const number = index + 1;
    return (
    `<a href="#detail/${number}"><span class="history-number">Lần ${number}</span><span class="history-info">
      <strong>${date}</strong><small class="history-volume">${icon('needle')}<span>${volume} ml&nbsp; (Toàn phần)</span></small>
      <span class="history-place">${center}</span>${icon('chevron')}
    </span></a>`);
  }).reverse().join('')}</div>`;
}
function detail(number) {
  const donation = donations[number-1];
  if (!donation) return '<div class="subpage">Không tìm thấy lần hiến máu.</div>';
  const { date, volume, journey } = donation;
  const labels = ['Chi tiết','Loại xét nghiệm','Nhận định'];
  const steps = [{ label: 'Hiến máu', date }, ...journey].map(step =>
    `<li><span class="timeline-check" aria-hidden="true"></span>${step.label}<time>${step.date}</time></li>`
  ).join('');
  const information = `<section class="detail-card"><h2>Lần hiến máu ${number}</h2><dl>
    <dt>Ngày hiến máu:</dt><dd>${date}</dd>
    <dt>Địa điểm:</dt><dd>${site}</dd>
    <dt>Lượng máu:</dt><dd>${volume} ml</dd>
    <dt>Cân nặng:</dt><dd>53 kg</dd>
    </dl></section>
    <section class="detail-card"><h2>Hành trình đơn vị máu của bạn</h2><ol class="timeline">${steps}</ol></section>`;
  return `<div class="detail"><div class="segments" role="group" aria-label="Chi tiết lần hiến máu">
    ${labels.map((label,index)=>`<button type="button" aria-pressed="${index===segment}" data-action="segment/${index}">${label}</button>`).join('')}</div>
    ${segment===0?information:`<section class="detail-card"><h2>${labels[segment]}</h2><p class="muted">Chưa có dữ liệu trong bản demo.</p></section>`}</div>`;
}
function notifications() {
  return state.notifications.length ? state.notifications.map(item =>
    `<article class="notice">${asset('notification.png')}<button type="button" data-action="notice/${item.id}">
     <h2>${escape(item.title)}</h2><p>${escape(item.message)}</p><time>${escape(item.time)}</time></button>
     <button class="notice-menu" type="button" data-action="notice-menu/${item.id}" aria-label="Tùy chọn thông báo">${icon('dots')}</button></article>`
  ).join('') : '<div class="subpage muted">Chưa có thông báo.</div>';
}
function settingsLink(name,symbol,route) {
  return `<a class="settings-row" href="#${route}">${icon(symbol)}<span>${name}</span>${icon('chevron')}</a>`;
}
function settings() {
  return `<section class="profile-banner">
     <div class="avatar-wrapper"><span class="profile-avatar">${avatarImage()}</span>
     <button type="button" data-action="avatar" aria-label="Đổi ảnh đại diện">${icon('camera')}</button>
     <input type="file" id="avatar-upload" accept="image/*" hidden></div>
     <h2>${escape(state.profile.name)}</h2><span class="level">Mức2</span>
    </section>
    <h2 class="group-label">Cài đặt chung</h2>
    ${settingsLink('Cập nhật thông tin cá nhân&nbsp; <span class="required">*</span>','user','profile')}
    ${settingsLink('Lịch sử hiến máu','history','history')}
    <h2 class="group-label">Bạn bè</h2>${settingsLink('Danh sách bạn bè','friends','friends')}
    <h2 class="group-label">Nhóm</h2>${settingsLink('Tham gia nhóm','add','groups')}
    <button class="settings-row danger" type="button" data-action="reset">${icon('delete')}<span>Xoá tài khoản</span></button>
    <button class="settings-row logout" type="button" data-action="logout">${icon('logout')}<span>Đăng xuất</span></button>
    <p class="version">version: 2.4.13</p>`;
}
function formBand(title,content) {
  return `<fieldset class="form-band"><legend>${title}</legend><div class="fields">${content}</div></fieldset>`;
}
function field(data, key, label, { type = 'text', star = false, placeholder = '', options = [] } = {}) {
  const control = options.length
    ? `<select name="${key}">${options.map(value=>`<option${value===data[key]?' selected':''}>${escape(value)}</option>`).join('')}</select>`
    : `<input name="${key}" type="${type}" value="${escape(data[key])}" placeholder="${escape(placeholder)}" ${key==='name'?'required':''}>`;
  return `<label class="form-row"><span>${label}${star?' <span class="required">*</span>':''}</span>${key==='phone'?`<span class="phone-edit">${control}${asset('edit.png')}</span>`:control}</label>`;
}
function profileForm() {
  const data = draft || state.profile;
  const identity = field(data,'name','Họ và tên',{star:true})+field(data,'dob','Ngày sinh',{star:true,placeholder:'dd/mm/yyyy'})+
    field(data,'identity','Số CMND',{star:true,placeholder:'Số CMND / CCCD'})+field(data,'gender','Giới tính',{options:['Nam','Nữ','Khác']});
  const personal = field(data,'phone','Điện thoại',{star:true,type:'tel',placeholder:'Điện thoại'})+field(data,'email','Email',{type:'email',placeholder:'Email'})+
    field(data,'student','Mã thẻ SV',{placeholder:'Mã thẻ SV'})+field(data,'job','Nghề nghiệp')+field(data,'workplace','Cơ quan');
  return `<form id="profile-form">${formBand('Thông tin xác thực',identity)}${formBand('Thông tin cá nhân',personal)}</form>`;
}
function addressFields(data, prefix) {
  return field(data,prefix+'City','Tỉnh/Thành phố')+field(data,prefix+'District','Quận/Huyện')+
    field(data,prefix+'Ward','Xã/Phường')+field(data,prefix+'Street','Địa chỉ cụ thể',{placeholder:'Địa chỉ cụ thể'});
}
function addressForm() {
  const data = draft || state.profile;
  return `<form id="address-form">${formBand('Địa chỉ thường trú <span class="required">*</span>',addressFields(data,'permanent'))}
    ${formBand('Địa chỉ liên lạc <span class="required">*</span>',`<label class="switch">Giống địa chỉ thường trú
       <input type="checkbox" name="same" role="switch"${data.same?' checked':''}></label>
       <div id="contact-fields"${data.same?' hidden':''}>${addressFields(data,'contact')}</div>`)}</form>`;
}
const subpage = content => `<div class="subpage">${content}</div>`;
const subcard = (title,content) => `<section class="subcard"><h2>${title}</h2>${content}</section>`;
function booking() {
  return subpage(`<form id="booking-form" class="subcard">
    <label>Địa điểm<select name="location">${locationNames.map(name=>`<option${name===bookingLocation?' selected':''}>${name}</option>`).join('')}</select></label>
    <label>Ngày hiến máu<input type="date" name="date" value="${localDate()}" min="${localDate()}" required></label>
    <label>Giờ hẹn<select name="time"><option>08:00</option><option>09:00</option><option>10:00</option><option>14:00</option><option>15:00</option></select></label>
    <button class="primary">ĐẶT LỊCH MẪU</button></form>
    ${state.appointments.map(item=>subcard(escape(item.location),`<p>${dateDisplay(item.date)} · ${item.time}</p>${button('Hủy lịch mẫu',`cancel/${item.id}`,'primary')}`)).join('')}`);
}
const subviews = {
  news: () => subpage(`<div class="news-list">${articlesHtml()}</div>`),
  booking,
  places: () => subpage(locationNames.map((name,index)=>subcard(name,button('Đặt lịch',`place/${index}`,'primary'))).join('')),
  hospitals: () => subpage(subcard('Viện Huyết học - Truyền máu TW',`<p>${site}</p>`)),
  groups: () => subpage(subcard('Nhóm hiến máu tình nguyện',button(state.group?'Rời nhóm mẫu':'Tham gia nhóm mẫu','group','primary'))),
  friends: () => subpage(`<form id="friends-form" class="subcard"><label>Tên bạn<input name="name" required maxlength="80"></label><button class="primary">Thêm bạn</button></form>
    ${state.friends.map((name,index)=>subcard(escape(name),button('Xóa',`remove-friend/${index}`))).join('')}`),
  contact: () => subpage(`<form id="contact-form" class="subcard"><label>Nội dung góp ý<textarea name="message" rows="4" required></textarea></label><button class="primary">Xem góp ý mẫu</button></form>`),
  benefits: () => subpage(subcard('Ưu đãi','<p class="muted">Chưa có ưu đãi trong bản demo.</p>')),
  faq: () => subpage(subcard('Hỏi đáp','<details><summary>Xem lịch sử hiến máu ở đâu?</summary><p>Chọn Lịch sử ở thanh điều hướng phía dưới.</p></details><details><summary>Lịch hẹn mẫu được lưu ở đâu?</summary><p>Lịch hẹn được lưu trên trình duyệt này.</p></details>'))
};
const screenTitles = Object.fromEntries([
  ...shortcuts, ['history','Lịch sử hiến máu'],['qr','Mã QR code'],['notifications','Thông báo'],['settings','Thông tin tài khoản'],
  ['detail','Chi tiết lần hiến máu'],['profile','Cập nhật thông tin'],['address','Cập nhật thông tin'],['news','Tin tức']
]);
function render(resetScroll = false) {
  const [page, id] = currentRoute().split('/');
  document.body.className = state.signedOut ? 'page-signout' : `page-${page}`;
  footer.innerHTML = '';
  if (state.signedOut) {
    masthead('Hiến máu');
    main.innerHTML = subpage(subcard('Hiến máu',button('Mở hồ sơ mẫu','signin','primary')));
  } else if (page==='home') {
    masthead('Hiến máu');
    main.innerHTML = home(id==='countdown');
    footer.innerHTML = navigation(page);
    const slides = main.querySelector('.slides');
    slides.addEventListener('scroll',()=>{
      const index = Math.round(slides.scrollLeft / slides.clientWidth);
      main.querySelectorAll('.carousel-dots button').forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
    },{passive:true});
  } else {
    const back = page==='detail'?'history':page==='profile'?'settings':page==='address'?'profile':
      (page==='groups'||page==='friends')?'settings':Object.hasOwn(subviews,page)?'home':'';
    masthead(screenTitles[page]||'Hiến máu',back,page==='profile');
    if (tabs.some(([key])=>key===page)) footer.innerHTML = navigation(page);
    if (page==='history') main.innerHTML = history();
    else if (page==='detail') main.innerHTML = detail(Number(id));
    else if (page==='notifications') main.innerHTML = notifications();
    else if (page==='settings') main.innerHTML = settings();
    else if (page==='qr') main.innerHTML = qrPage();
    else if (page==='profile') {
      main.innerHTML = profileForm();
      footer.innerHTML = submitFooter('TIẾP TỤC','profile-form');
    } else if (page==='address') {
      main.innerHTML = addressForm();
      footer.innerHTML = submitFooter('GỬI CẬP NHẬT','address-form');
    } else main.innerHTML = Object.hasOwn(subviews,page)?subviews[page]():subpage('<a href="#home">Về Trang chủ</a>');
  }
  if (resetScroll) {
    main.scrollTop = 0;
    main.focus({preventScroll:true});
  }
}
function saveAndRender(text) {
  persist(); render(); notify(text);
}
document.addEventListener('click',event=>{
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const [action,value] = target.dataset.action.split('/');
  const notice = state.notifications.find(item=>item.id===value);
  switch(action) {
    case 'close': dialog.close(); break;
    case 'scan-qr':
      modal('Quét mã QR để kết nối', '<label class="qr-file">Chụp hoặc chọn ảnh chứa mã QR<input type="file" id="qr-upload" accept="image/*"></label><p id="qr-result" role="status"></p>');
      break;
    case 'slide': {
      const slides = main.querySelector('.slides');
      slides.scrollTo({left:Number(value)*slides.clientWidth,behavior:'smooth'});
      break;
    }
    case 'article': {
      const [image,title,body] = articles[Number(value)];
      modal(title,`${asset(image,title)}<p>${body}</p>`);
      break;
    }
    case 'segment': {
      segment = Number(value);
      const position = main.scrollTop;
      main.innerHTML = detail(Number(currentRoute().split('/')[1]));
      main.scrollTop = position;
      main.querySelector('[aria-pressed="true"]').focus();
      break;
    }
    case 'notice':
      if (notice) {
        notice.read=true; persist();
        modal(notice.title,`<p>${escape(notice.message)}</p><p class="muted">${escape(notice.time)}</p>`);
      }
      break;
    case 'notice-menu':
      if (notice) modal('Tùy chọn thông báo','',button('Đánh dấu đã đọc',`read/${value}`)+button('Xóa thông báo',`delete-notice/${value}`));
      break;
    case 'read':
      if (notice) notice.read=true;
      dialog.close(); saveAndRender('Đã đánh dấu đã đọc.'); break;
    case 'delete-notice':
      state.notifications=state.notifications.filter(item=>item.id!==value);
      dialog.close(); saveAndRender('Đã xóa thông báo.'); break;
    case 'avatar': document.querySelector('#avatar-upload').click(); break;
    case 'reset': modal('Xoá tài khoản','<p>Đặt lại hồ sơ và lịch hẹn trên trình duyệt này?</p>',button('Xóa dữ liệu mẫu','reset-confirm')); break;
    case 'reset-confirm':
      state=initialState(); draft=null; dialog.close(); saveAndRender('Đã đặt lại dữ liệu mẫu.'); break;
    case 'logout':
      state.signedOut=true; draft=null; persist(); openRoute('home'); break;
    case 'signin':
      state.signedOut=false; persist(); openRoute('home'); break;
    case 'place':
      bookingLocation=locationNames[Number(value)]; openRoute('booking'); break;
    case 'cancel':
      modal('Hủy lịch hẹn mẫu','',button('Hủy lịch',`cancel-confirm/${value}`)); break;
    case 'cancel-confirm':
      state.appointments=state.appointments.filter(item=>item.id!==value);
      state.notifications=state.notifications.filter(item=>item.id!==value);
      dialog.close(); saveAndRender('Đã hủy lịch mẫu.'); break;
    case 'group':
      state.group=!state.group;
      saveAndRender(state.group?'Đã tham gia nhóm mẫu.':'Đã rời nhóm mẫu.'); break;
    case 'remove-friend':
      state.friends.splice(Number(value),1); saveAndRender('Đã xóa bạn.'); break;
  }
});
document.addEventListener('submit',event=>{
  const form = event.target;
  event.preventDefault();
  const data = Object.fromEntries([...new FormData(form)].map(([name,value])=>[name,String(value).trim()]));
  switch(form.id) {
    case 'profile-form':
      if (!data.name) { notify('Vui lòng nhập họ và tên.'); return; }
      draft = {...(draft||state.profile),...data};
      openRoute('address'); break;
    case 'address-form': {
      const same = data.same==='on';
      const updated = {...(draft||state.profile),...data,same};
      if (same) ['City','District','Ward','Street'].forEach(key=>{updated['contact'+key]=updated['permanent'+key];});
      state.profile=updated; draft=null; persist(); openRoute('settings'); notify('Đã cập nhật thông tin.'); break;
    }
    case 'booking-form': {
      if (state.appointments.some(item=>item.date===data.date&&item.time===data.time)) {
        notify('Bạn đã lưu lịch vào thời điểm này.'); return;
      }
      const id=Date.now().toString(36);
      bookingLocation=data.location;
      state.appointments.unshift({id,...data});
      state.notifications.unshift({
        id,title:sampleNotification.title,read:false,time:dateDisplay(localDate()),
        message:`Cảm ơn Bạn đã đăng ký lịch hiến máu mẫu ngày ${dateDisplay(data.date)} lúc ${data.time} tại ${data.location}.`
      });
      saveAndRender('Đã đặt lịch mẫu.'); break;
    }
    case 'friends-form':
      if (!data.name) return;
      state.friends.push(data.name); saveAndRender('Đã thêm bạn.'); break;
    case 'contact-form':
      if (data.message) modal('Nội dung góp ý mẫu',`<p>${escape(data.message)}</p>`); break;
  }
});
document.addEventListener('change',event=>{
  const input=event.target;
  if (input.name==='same') document.querySelector('#contact-fields').hidden=!input.checked;
  if (input.id==='qr-upload') { void readQrImage(input); return; }
  if (input.id!=='avatar-upload'||!input.files[0]) return;
  const url=URL.createObjectURL(input.files[0]);
  const picture=new Image();
  picture.onload=()=>{
    URL.revokeObjectURL(url);
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=300;
    const crop=Math.min(picture.naturalWidth,picture.naturalHeight);
    canvas.getContext('2d').drawImage(picture,(picture.naturalWidth-crop)/2,(picture.naturalHeight-crop)/2,crop,crop,0,0,300,300);
    state.profile.avatar=canvas.toDataURL('image/jpeg',.85);
    saveAndRender('Đã đổi ảnh đại diện.');
  };
  picture.onerror=()=>{URL.revokeObjectURL(url);notify('Không đọc được ảnh.');};
  picture.src=url;
});
window.addEventListener('hashchange',()=>{
  if (dialog.open) dialog.close();
  segment=0;
  if (!['profile','address'].includes(currentRoute())) draft=null;
  render(true);
});
render();
