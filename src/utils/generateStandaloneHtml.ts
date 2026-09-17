export function getStandaloneHtmlCode(): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ระบบบันทึกสต๊อกสินค้า เข้า-ออก (Stock In-Out)</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts Prompt -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <!-- FontAwesome Icons for Standalone -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    body { font-family: 'Prompt', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

  <!-- Navbar -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          <i class="fa-solid fa-boxes-stacked"></i>
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 leading-tight">ระบบบันทึกสต๊อกสินค้า เข้า-ออก</h1>
          <p class="text-xs text-slate-500">บันทึกสต๊อกสินค้า คำนวณราคา และจัดเก็บข้อมูลผ่าน LocalStorage</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="resetData()" class="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
          <i class="fa-solid fa-rotate-left mr-1"></i> รีเซ็ตข้อมูลจำลอง
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- สรุปตัวเลขสถิติ (Stats Cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500">สินค้ารับเข้าทั้งหมด</p>
          <p id="statTotalIn" class="text-2xl font-bold text-emerald-600 mt-1">0 ชิ้น</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-arrow-down"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500">สินค้าจ่ายออกทั้งหมด</p>
          <p id="statTotalOut" class="text-2xl font-bold text-rose-600 mt-1">0 ชิ้น</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-arrow-up"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500">สต๊อกคงเหลือสุทธิ</p>
          <p id="statNetStock" class="text-2xl font-bold text-indigo-600 mt-1">0 ชิ้น</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-layer-group"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500">มูลค่ารวมรายการทั้งหมด</p>
          <p id="statTotalVal" class="text-2xl font-bold text-slate-900 mt-1">฿0</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-coins"></i>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- ฝั่งซ้าย: ฟอร์มกรอกข้อมูล -->
      <div class="lg:col-span-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sticky top-24">
          <h2 class="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <i class="fa-regular fa-pen-to-square text-indigo-600"></i>
            ฟอร์มบันทึกสต๊อกสินค้า
          </h2>

          <form id="stockForm" onsubmit="handleFormSubmit(event)" class="mt-4 space-y-3.5">
            <!-- ประเภทรายการ: รับเข้า / จ่ายออก -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1.5">ประเภทรายการ <span class="text-rose-500">*</span></label>
              <div class="grid grid-cols-2 gap-2">
                <label class="cursor-pointer border rounded-lg p-2.5 flex items-center justify-center gap-2 text-sm font-medium border-slate-200 hover:bg-slate-50 transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
                  <input type="radio" name="type" value="IN" class="sr-only" checked onchange="updateFormTheme()" />
                  <i class="fa-solid fa-circle-down text-emerald-600"></i> รับเข้า (IN)
                </label>
                <label class="cursor-pointer border rounded-lg p-2.5 flex items-center justify-center gap-2 text-sm font-medium border-slate-200 hover:bg-slate-50 transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-700">
                  <input type="radio" name="type" value="OUT" class="sr-only" onchange="updateFormTheme()" />
                  <i class="fa-solid fa-circle-up text-rose-600"></i> จ่ายออก (OUT)
                </label>
              </div>
            </div>

            <!-- วันที่ -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">วันที่ <span class="text-rose-500">*</span></label>
              <input type="date" id="dateInput" required class="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            <!-- กลุ่มที่ผลิตสินค้า -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">กลุ่มที่ผลิตสินค้า <span class="text-rose-500">*</span></label>
              <select id="categoryInput" required class="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">-- เลือกกลุ่มที่ผลิตสินค้า --</option>
                <option value="กระจูดรายา">1. กระจูดรายา</option>
                <option value="กระจูด Change">2. กระจูด Change</option>
                <option value="น้ำผึ้งชันโรงบ้านไพรวัน">3. น้ำผึ้งชันโรงบ้านไพรวัน</option>
                <option value="ผ้าทอตอหลัง">4. ผ้าทอตอหลัง</option>
                <option value="เรือกอและจำลอง">5. เรือกอและจำลอง</option>
              </select>
            </div>

            <!-- รายการสินค้า (เลือกจาก Dropdown หรือพิมพ์เอง) -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-medium text-slate-700">รายการสินค้า <span class="text-rose-500">*</span></label>
                <button type="button" onclick="toggleStandaloneManualInput()" id="toggleInputModeBtn" class="text-[11px] text-indigo-600 hover:underline">
                  พิมพ์ชื่อเอง
                </button>
              </div>

              <!-- Dropdown เลือกสินค้า -->
              <div id="productSelectWrapper">
                <select id="productSelect" onchange="handleProductSelect(this.value)" class="w-full text-sm px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/20 font-medium">
                  <option value="">-- เลือกรายการสินค้าจากคลัง --</option>
                </select>
                <div id="autoPriceBadge" class="hidden mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] flex items-center justify-between">
                  <span>✨ ดึงราคาอัตโนมัติ</span>
                  <span id="autoPriceVal" class="font-bold"></span>
                </div>
              </div>

              <!-- Input พิมพ์ชื่อเอง -->
              <div id="productInputWrapper" class="hidden">
                <input type="text" id="productNameInput" placeholder="เช่น ชาอัญชันมะนาว 300ml" class="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
            </div>

            <!-- ราคาขายต่อหน่วย และ จำนวน -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label id="priceLabel" class="block text-xs font-medium text-slate-700 mb-1">ราคารับเข้า/หน่วย (฿) <span class="text-rose-500">*</span></label>
                <input type="number" id="priceInput" min="0" step="0.5" placeholder="0.00" required class="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold" oninput="calculateTotal()" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">จำนวน <span class="text-rose-500">*</span></label>
                <input type="number" id="quantityInput" min="1" step="1" placeholder="1" required class="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" oninput="calculateTotal()" />
              </div>
            </div>

            <!-- คำนวณยอดรวม -->
            <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <span class="text-slate-600">มูลค่ารวมรายการนี้:</span>
              <span id="previewTotal" class="font-bold text-sm text-indigo-600">฿0.00</span>
            </div>

            <!-- ผู้แจ้ง -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">ผู้แจ้ง <span class="text-rose-500">*</span></label>
              <input type="text" id="reporterInput" placeholder="ชื่อ-นามสกุล ผู้แจ้งหรือบันทึก" required class="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            <!-- ปุ่มบันทึก -->
            <button type="submit" id="submitBtn" class="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
              <i class="fa-solid fa-plus"></i> บันทึกข้อมูลเข้าสต๊อก
            </button>
          </form>
        </div>
      </div>

      <!-- ฝั่งขวา: ตารางแสดงรายการย้อนหลัง -->
      <div class="lg:col-span-8 space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 class="text-base font-semibold text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-indigo-600"></i>
                ตารางแสดงรายการย้อนหลัง
              </h2>
              <p class="text-xs text-slate-500 mt-0.5" id="recordCountLabel">แสดงทั้งหมด 0 รายการ</p>
            </div>

            <!-- ตัวกรองค้นหา & กลุ่มสินค้า -->
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative min-w-[180px]">
                <input type="text" id="searchInput" placeholder="ค้นหาสินค้า/ผู้แจ้ง..." oninput="renderTable()" class="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <i class="fa-solid fa-magnifying-glass text-slate-400 absolute left-2.5 top-2.5 text-xs"></i>
              </div>

              <select id="typeFilter" onchange="renderTable()" class="text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white">
                <option value="ALL">ทุกประเภท</option>
                <option value="IN">เฉพาะรับเข้า (IN)</option>
                <option value="OUT">เฉพาะจ่ายออก (OUT)</option>
              </select>
            </div>
          </div>

          <!-- ตาราง -->
          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th class="py-3 px-3">วันที่</th>
                  <th class="py-3 px-3">ประเภท</th>
                  <th class="py-3 px-3">กลุ่มที่ผลิต</th>
                  <th class="py-3 px-3">รายการสินค้า</th>
                  <th class="py-3 px-3 text-right">ราคา/หน่วย</th>
                  <th class="py-3 px-3 text-right">จำนวน</th>
                  <th class="py-3 px-3 text-right">รวมเงิน</th>
                  <th class="py-3 px-3">ผู้แจ้ง</th>
                  <th class="py-3 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody id="tableBody" class="divide-y divide-slate-100">
                <!-- ข้อมูลจะถูก render ด้วย JavaScript -->
              </tbody>
            </table>
          </div>

          <!-- กล่องเมื่อไม่มีข้อมูล -->
          <div id="emptyState" class="hidden text-center py-12">
            <i class="fa-solid fa-box-open text-4xl text-slate-300 mb-2"></i>
            <p class="text-slate-500 text-sm">ยังไม่มีรายการบันทึก หรือไม่พบข้อมูลตามคำค้นหา</p>
          </div>
        </div>
      </div>

    </div>
  </main>

  <script>
    const STORAGE_KEY = 'STOCK_IN_OUT_INVENTORY_V1';
    const CATALOG_KEY = 'STOCK_PRODUCT_CATALOG_V1';

    // แคตตาล็อกสินค้าตั้งต้น
    const initialCatalog = [
      { id: '1', name: 'กระเป๋าสานกระจูด ลายพิกุล', category: 'กระจูดรายา', unit: 'ใบ', costPrice: 320, sellingPrice: 450 },
      { id: '2', name: 'หมวกสานกระจูด สไตล์วินเทจ', category: 'กระจูดรายา', unit: 'ใบ', costPrice: 180, sellingPrice: 280 },
      { id: '3', name: 'ตะกร้ากระจูดใส่เอกสาร A4', category: 'กระจูด Change', unit: 'ใบ', costPrice: 220, sellingPrice: 350 },
      { id: '4', name: 'น้ำผึ้งชันโรงแท้ 100% (250ml)', category: 'น้ำผึ้งชันโรงบ้านไพรวัน', unit: 'ขวด', costPrice: 250, sellingPrice: 390 },
      { id: '5', name: 'ผ้าคลุมไหล่ทอมือ ย้อมสีธรรมชาติ', category: 'ผ้าทอตอหลัง', unit: 'ผืน', costPrice: 480, sellingPrice: 690 },
      { id: '6', name: 'เรือกอและจำลอง 12 นิ้ว (ลงสีลายกนก)', category: 'เรือกอและจำลอง', unit: 'ลำ', costPrice: 850, sellingPrice: 1250 }
    ];

    let isManualMode = false;

    function getCatalog() {
      const raw = localStorage.getItem(CATALOG_KEY);
      if (!raw) return initialCatalog;
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialCatalog;
      } catch (e) {
        return initialCatalog;
      }
    }

    function populateProductDropdown() {
      const catalog = getCatalog();
      const select = document.getElementById('productSelect');
      select.innerHTML = '<option value="">-- เลือกรายการสินค้าจากคลัง (' + catalog.length + ' รายการ) --</option>';

      // จัดกลุ่มตาม category
      const groups = {};
      catalog.forEach(item => {
        const cat = item.category || 'สินค้าทั่วไป';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      });

      Object.entries(groups).forEach(([cat, items]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'กลุ่ม: ' + cat;
        items.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = item.name + ' (ขาย ฿' + item.sellingPrice + ' | ทุน ฿' + item.costPrice + ')';
          optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
      });
    }

    function toggleStandaloneManualInput() {
      isManualMode = !isManualMode;
      const selectWrap = document.getElementById('productSelectWrapper');
      const inputWrap = document.getElementById('productInputWrapper');
      const btn = document.getElementById('toggleInputModeBtn');

      if (isManualMode) {
        selectWrap.classList.add('hidden');
        inputWrap.classList.remove('hidden');
        btn.textContent = 'เลือกจาก Dropdown';
        document.getElementById('productNameInput').focus();
      } else {
        selectWrap.classList.remove('hidden');
        inputWrap.classList.add('hidden');
        btn.textContent = 'พิมพ์ชื่อเอง';
      }
    }

    function handleProductSelect(catalogId) {
      const badge = document.getElementById('autoPriceBadge');
      const valSpan = document.getElementById('autoPriceVal');
      if (!catalogId) {
        badge.classList.add('hidden');
        return;
      }
      const catalog = getCatalog();
      const item = catalog.find(p => p.id === catalogId);
      if (!item) return;

      // เลือกกลุ่มอัตโนมัติ
      const categoryInput = document.getElementById('categoryInput');
      categoryInput.value = item.category;

      // กรอกชื่อสินค้า
      document.getElementById('productNameInput').value = item.name;

      // ดึงราคาอัตโนมัติ ตาม IN หรือ OUT
      const type = document.querySelector('input[name="type"]:checked').value;
      const price = type === 'IN' ? (item.costPrice || item.sellingPrice) : item.sellingPrice;
      document.getElementById('priceInput').value = price;

      badge.classList.remove('hidden');
      valSpan.textContent = '฿' + price + ' / ' + (item.unit || 'ชิ้น');
      calculateTotal();
    }

    // เมื่อเปลี่ยนประเภท IN หรือ OUT ให้อัปเดตป้ายราคาและราคาอัตโนมัติถ้าเลือกสินค้าอยู่
    function onTypeChanged() {
      const type = document.querySelector('input[name="type"]:checked').value;
      const priceLabel = document.getElementById('priceLabel');
      if (type === 'IN') {
        priceLabel.innerHTML = 'ราคารับเข้า/หน่วย (฿) <span class="text-rose-500">*</span>';
      } else {
        priceLabel.innerHTML = 'ราคาขาย/หน่วย (฿) <span class="text-rose-500">*</span>';
      }

      const select = document.getElementById('productSelect');
      if (select && select.value) {
        handleProductSelect(select.value);
      }
    }

    // โหลดข้อมูลจาก LocalStorage
    function getStoredData() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    function saveData(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      renderTable();
      renderStats();
    }

    function resetData() {
      if (confirm('คุณต้องการล้างข้อมูลสต๊อกทั้งหมดหรือไม่?')) {
        saveData([]);
      }
    }

    // คำนวณมูลค่ารวมในฟอร์มแบบเรียลไทม์
    function calculateTotal() {
      const price = parseFloat(document.getElementById('priceInput').value) || 0;
      const qty = parseInt(document.getElementById('quantityInput').value) || 0;
      const total = price * qty;
      document.getElementById('previewTotal').textContent = '฿' + total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    }

    // บันทึกข้อมูล
    function handleFormSubmit(e) {
      e.preventDefault();
      const type = document.querySelector('input[name="type"]:checked').value;
      const date = document.getElementById('dateInput').value;
      const category = document.getElementById('categoryInput').value;

      let productName = '';
      if (isManualMode) {
        productName = document.getElementById('productNameInput').value.trim();
      } else {
        const selId = document.getElementById('productSelect').value;
        const item = getCatalog().find(p => p.id === selId);
        productName = item ? item.name : document.getElementById('productNameInput').value.trim();
      }

      if (!productName) {
        alert('กรุณาเลือกสินค้าจาก Dropdown หรือพิมพ์ชื่อสินค้า');
        return;
      }

      const unitPrice = parseFloat(document.getElementById('priceInput').value) || 0;
      const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
      const reporter = document.getElementById('reporterInput').value.trim();

      const newRecord = {
        id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
        date,
        type,
        category,
        productName,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        reporter
      };

      const data = getStoredData();
      data.unshift(newRecord); // นำรายการใหม่ไว้บนสุด
      saveData(data);

      // รีเซ็ตฟอร์ม (คงวันที่และผู้แจ้งไว้เพื่อความสะดวก)
      document.getElementById('productNameInput').value = '';
      document.getElementById('productSelect').value = '';
      document.getElementById('autoPriceBadge').classList.add('hidden');
      document.getElementById('priceInput').value = '';
      document.getElementById('quantityInput').value = '1';
      calculateTotal();
      alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
    }

    // ลบรายการ
    function deleteRecord(id) {
      if (confirm('ยืนยันการลบรายการนี้ออกจากระบบหรือไม่?')) {
        const data = getStoredData().filter(item => item.id !== id);
        saveData(data);
      }
    }

    // แสดงผลตาราง
    function renderTable() {
      const data = getStoredData();
      const search = (document.getElementById('searchInput').value || '').toLowerCase();
      const typeFilter = document.getElementById('typeFilter').value;

      const filtered = data.filter(item => {
        const matchesSearch = item.productName.toLowerCase().includes(search) || 
                              item.reporter.toLowerCase().includes(search) ||
                              item.category.toLowerCase().includes(search);
        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
        return matchesSearch && matchesType;
      });

      const tbody = document.getElementById('tableBody');
      const emptyState = document.getElementById('emptyState');
      document.getElementById('recordCountLabel').textContent = \`แสดง \${filtered.length} จากทั้งหมด \${data.length} รายการ\`;

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = filtered.map(item => {
        const isIN = item.type === 'IN';
        return \`
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-3 whitespace-nowrap text-xs text-slate-500">\${item.date}</td>
            <td class="py-3 px-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium \${isIN ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                <i class="fa-solid \${isIN ? 'fa-arrow-down' : 'fa-arrow-up'} text-[10px]"></i>
                \${isIN ? 'รับเข้า (IN)' : 'จ่ายออก (OUT)'}
              </span>
            </td>
            <td class="py-3 px-3 text-xs text-slate-700 font-medium">\${item.category}</td>
            <td class="py-3 px-3 font-medium text-slate-900">\${item.productName}</td>
            <td class="py-3 px-3 text-right text-xs">฿\${Number(item.unitPrice).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-3 text-right font-semibold text-slate-800">\${item.quantity.toLocaleString('th-TH')}</td>
            <td class="py-3 px-3 text-right font-bold text-indigo-600">฿\${Number(item.totalPrice).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-3 text-xs text-slate-600">\${item.reporter}</td>
            <td class="py-3 px-3 text-center">
              <button onclick="deleteRecord('\${item.id}')" title="ลบรายการ" class="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition">
                <i class="fa-regular fa-trash-can text-sm"></i>
              </button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // คำนวณสรุปสถิติ
    function renderStats() {
      const data = getStoredData();
      let totalIn = 0;
      let totalOut = 0;
      let totalValue = 0;

      data.forEach(item => {
        if (item.type === 'IN') {
          totalIn += Number(item.quantity) || 0;
        } else {
          totalOut += Number(item.quantity) || 0;
        }
        totalValue += Number(item.totalPrice) || 0;
      });

      document.getElementById('statTotalIn').textContent = totalIn.toLocaleString('th-TH') + ' ชิ้น';
      document.getElementById('statTotalOut').textContent = totalOut.toLocaleString('th-TH') + ' ชิ้น';
      document.getElementById('statNetStock').textContent = (totalIn - totalOut).toLocaleString('th-TH') + ' ชิ้น';
      document.getElementById('statTotalVal').textContent = '฿' + totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    }

    // ตั้งค่าเริ่มต้นของฟอร์ม
    window.addEventListener('DOMContentLoaded', () => {
      // ใส่วันที่ปัจจุบันเป็นค่าตั้งต้น
      document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
      document.getElementById('quantityInput').value = '1';
      populateProductDropdown();
      onTypeChanged();
      renderTable();
      renderStats();
    });
  </script>
</body>
</html>`;
}
