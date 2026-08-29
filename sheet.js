// ==================== PROFESSIONAL MODERN SHEET (ES5, Full Featured) ====================
var ModernSheet = function(containerId, options) {
  options = options || {};
  this.container = document.getElementById(containerId);
  if (!this.container) return;
  this.data = options.data || [];
  this.columns = options.columns || [];
  this.emptyMessage = options.emptyMessage || 'No data';
  this.showSearch = options.showSearch !== false;
  this.showFontSlider = options.showFontSlider !== false;
  this.frozenColumns = options.frozenColumns || 0;
  this.sortCol = null;
  this.sortAsc = true;
  this.searchText = '';
  this.hiddenColumns = new Set();
  this.columnFilters = {};
  this.currentFontSize = 13;
  this.build();
};

ModernSheet.prototype.build = function() {
  this.container.innerHTML = '';
  var self = this;
  var toolbar = document.createElement('div');
  toolbar.className = 'modern-sheet-toolbar';

  if (this.showSearch) {
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = '🔍 Search…';
    this.searchInput.oninput = function() { self.searchText = this.value.toLowerCase(); self.render(); };
    toolbar.appendChild(this.searchInput);
  }

  var columnsBtn = document.createElement('button');
  columnsBtn.textContent = '☰ Columns';
  columnsBtn.onclick = function(e) { self.toggleColumnMenu(e); };
  toolbar.appendChild(columnsBtn);

  var exportBtn = document.createElement('button');
  exportBtn.textContent = '📥 XLSX';
  exportBtn.onclick = function() { self.exportXLSX(); };
  toolbar.appendChild(exportBtn);

  if (this.showFontSlider) {
    var fontSlider = document.createElement('input');
    fontSlider.type = 'range';
    fontSlider.min = '10';
    fontSlider.max = '20';
    fontSlider.value = this.currentFontSize;
    fontSlider.style.width = '80px';
    fontSlider.oninput = function() {
      self.currentFontSize = parseInt(this.value);
      self.render();
    };
    toolbar.appendChild(fontSlider);
  }

  this.filterInfo = document.createElement('span');
  this.filterInfo.style.cssText = 'font-size:11px; color:#1a73e8; display:none;';
  toolbar.appendChild(this.filterInfo);
  this.container.appendChild(toolbar);

  this.columnMenu = document.createElement('div');
  this.columnMenu.className = 'modern-sheet-context-menu';
  this.columnMenu.style.display = 'none';
  this.container.appendChild(this.columnMenu);

  this.tableWrapper = document.createElement('div');
  this.tableWrapper.className = 'modern-sheet-table-wrapper';
  this.table = document.createElement('table');
  this.table.className = 'modern-sheet-table';
  this.thead = document.createElement('thead');
  this.tbody = document.createElement('tbody');
  this.tfoot = document.createElement('tfoot');
  this.table.appendChild(this.thead);
  this.table.appendChild(this.tbody);
  this.table.appendChild(this.tfoot);
  this.tableWrapper.appendChild(this.table);
  this.container.appendChild(this.tableWrapper);

  this.footer = document.createElement('div');
  this.footer.className = 'modern-sheet-footer';
  this.container.appendChild(this.footer);

  this.contextMenu = document.createElement('div');
  this.contextMenu.className = 'modern-sheet-context-menu';
  this.contextMenu.style.display = 'none';
  document.body.appendChild(this.contextMenu);

  this.filterDropdown = document.createElement('div');
  this.filterDropdown.className = 'modern-sheet-filter-dropdown';
  this.filterDropdown.style.display = 'none';
  document.body.appendChild(this.filterDropdown);

  document.addEventListener('click', function(e) {
    if (!self.columnMenu.contains(e.target) && e.target !== columnsBtn) {
      self.columnMenu.style.display = 'none';
    }
    if (!self.contextMenu.contains(e.target)) {
      self.contextMenu.style.display = 'none';
    }
    if (!self.filterDropdown.contains(e.target) && !e.target.classList.contains('filter-arrow')) {
      self.filterDropdown.style.display = 'none';
    }
  });

  this.table.addEventListener('contextmenu', function(e) { self.showContextMenu(e); });
  this.table.addEventListener('dblclick', function(e) {
    var handle = e.target.closest('.modern-sheet-resize-handle');
    if (handle) {
      var th = handle.parentNode;
      var colIdx = self.getColumnIndexFromTh(th);
      self.autoFitColumn(colIdx);
    }
  });

  this.render();
};

ModernSheet.prototype.buildHeader = function() {
  this.thead.innerHTML = '';
  var headerRow = document.createElement('tr');
  var self = this;

  for (var i = 0; i < this.columns.length; i++) {
    if (this.hiddenColumns.has(i)) continue;
    var col = this.columns[i];
    var th = document.createElement('th');
    th.style.position = 'relative';
    th.style.fontSize = this.currentFontSize + 'px';

    if (i < this.frozenColumns) {
      th.classList.add('frozen');
      th.style.left = self.getFrozenLeft(i) + 'px';
    }

    var sortIcon = '';
    if (this.sortCol === i) sortIcon = this.sortAsc ? ' ▲' : ' ▼';
    var filterMark = this.columnFilters[i] ? ' 🔽' : '';
    th.innerHTML = (col.title || '') + '<span class="sort-icon' + (this.sortCol === i ? ' active' : '') + '">' + sortIcon + '</span><span class="filter-arrow" style="margin-left:4px;cursor:pointer;font-size:10px;">▼</span>';

    if (col.width) th.style.width = col.width;

    (function(idx, thEl) {
      thEl.addEventListener('click', function(e) {
        if (e.target.classList.contains('modern-sheet-resize-handle') || e.target.classList.contains('filter-arrow')) return;
        if (self.sortCol === idx) { self.sortAsc = !self.sortAsc; }
        else { self.sortCol = idx; self.sortAsc = true; }
        self.render();
      });
    })(i, th);

    var filterArrow = th.querySelector('.filter-arrow');
    if (filterArrow) {
      (function(idx, arrow) {
        arrow.addEventListener('click', function(e) {
          e.stopPropagation();
          self.showFilterDropdown(e, idx);
        });
      })(i, filterArrow);
    }

    var handle = document.createElement('div');
    handle.className = 'modern-sheet-resize-handle';
    (function(idx, thEl) {
      handle.addEventListener('mousedown', function(e) { self.startResize(e, thEl, idx); });
    })(i, th);
    th.appendChild(handle);

    headerRow.appendChild(th);
  }
  this.thead.appendChild(headerRow);
};

ModernSheet.prototype.getFrozenLeft = function(colIdx) {
  var left = 0;
  for (var i = 0; i < colIdx; i++) {
    if (!this.hiddenColumns.has(i) && i < this.frozenColumns) {
      var w = this.columns[i].width ? parseInt(this.columns[i].width) : 100;
      left += w;
    }
  }
  return left;
};

ModernSheet.prototype.startResize = function(e, th, colIdx) {
  e.preventDefault();
  var startX = e.pageX;
  var startWidth = th.offsetWidth;
  var self = this;

  var onMove = function(e) {
    var newWidth = Math.max(40, startWidth + (e.pageX - startX));
    th.style.width = newWidth + 'px';
    self.columns[colIdx].width = newWidth + 'px';
    if (colIdx < self.frozenColumns) self.render();
  };
  var onUp = function() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

ModernSheet.prototype.autoFitColumn = function(colIdx) {
  var th = this.thead.querySelectorAll('th')[this.getVisibleIndex(colIdx)];
  if (!th) return;
  var maxWidth = th.offsetWidth;
  var rows = this.tbody.querySelectorAll('tr');
  for (var r = 0; r < rows.length; r++) {
    var cells = rows[r].querySelectorAll('td');
    var visibleIdx = this.getVisibleIndex(colIdx);
    if (cells[visibleIdx]) {
      var contentWidth = cells[visibleIdx].scrollWidth;
      if (contentWidth > maxWidth) maxWidth = contentWidth;
    }
  }
  var newWidth = Math.max(40, maxWidth + 20);
  th.style.width = newWidth + 'px';
  this.columns[colIdx].width = newWidth + 'px';
};

ModernSheet.prototype.getVisibleIndex = function(colIdx) {
  var cnt = 0;
  for (var i = 0; i < this.columns.length; i++) {
    if (i === colIdx) return cnt;
    if (!this.hiddenColumns.has(i)) cnt++;
  }
  return cnt;
};

ModernSheet.prototype.getColumnIndexFromTh = function(th) {
  var allThs = this.thead.querySelectorAll('th');
  var vis = Array.prototype.indexOf.call(allThs, th);
  var cnt = 0;
  for (var i = 0; i < this.columns.length; i++) {
    if (!this.hiddenColumns.has(i)) {
      if (cnt === vis) return i;
      cnt++;
    }
  }
  return 0;
};

ModernSheet.prototype.showFilterDropdown = function(e, colIdx) {
  e.stopPropagation();
  var self = this;
  var col = this.columns[colIdx];
  var vals = [];
  var seen = {};
  for (var i = 0; i < this.data.length; i++) {
    var item = this.data[i];
    var val = col.render ? col.render(item, false) : (item[col.field] || '');
    if (!seen[val]) { seen[val] = true; vals.push(val); }
  }
  vals.sort();

  this.filterDropdown.innerHTML = '';
  this.filterDropdown.style.display = 'block';
  this.filterDropdown.style.top = e.pageY + 'px';
  this.filterDropdown.style.left = e.pageX + 'px';

  var curFilter = this.columnFilters[colIdx] || null;

  var allLabel = document.createElement('label');
  var allCb = document.createElement('input');
  allCb.type = 'checkbox';
  allCb.checked = !curFilter;
  allCb.onchange = function() {
    if (this.checked) { delete self.columnFilters[colIdx]; }
    else { self.columnFilters[colIdx] = new Set(); }
    self.render();
    self.filterDropdown.style.display = 'none';
  };
  allLabel.appendChild(allCb);
  allLabel.appendChild(document.createTextNode(' (Select All)'));
  this.filterDropdown.appendChild(allLabel);

  for (var v = 0; v < vals.length; v++) {
    (function(value) {
      var label = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !curFilter || curFilter.has(value);
      cb.onchange = function() {
        if (!self.columnFilters[colIdx]) self.columnFilters[colIdx] = new Set(vals);
        if (this.checked) self.columnFilters[colIdx].add(value);
        else {
          self.columnFilters[colIdx].delete(value);
          if (self.columnFilters[colIdx].size === 0) delete self.columnFilters[colIdx];
        }
        self.render();
      };
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + value));
      self.filterDropdown.appendChild(label);
    })(vals[v]);
  }
};

ModernSheet.prototype.getFilteredData = function() {
  var filtered = this.data.slice();
  var self = this;

  if (this.searchText) {
    filtered = filtered.filter(function(item) {
      for (var i = 0; i < self.columns.length; i++) {
        var col = self.columns[i];
        var val = col.render ? col.render(item, false) : (item[col.field] || '');
        if (String(val).toLowerCase().indexOf(self.searchText) !== -1) return true;
      }
      return false;
    });
  }

  for (var colIdx in this.columnFilters) {
    if (this.columnFilters.hasOwnProperty(colIdx)) {
      var fSet = this.columnFilters[colIdx];
      if (fSet && fSet.size > 0) {
        var col = this.columns[parseInt(colIdx)];
        filtered = filtered.filter(function(item) {
          var val = col.render ? col.render(item, false) : (item[col.field] || '');
          return fSet.has(val);
        });
      }
    }
  }

  if (this.sortCol !== null) {
    var col = this.columns[this.sortCol];
    var asc = this.sortAsc;
    filtered.sort(function(a, b) {
      var va = col.render ? col.render(a, false) : (a[col.field] || '');
      var vb = col.render ? col.render(b, false) : (b[col.field] || '');
      if (typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
      return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  return filtered;
};

ModernSheet.prototype.computeTotals = function(filtered) {
  var totals = {};
  for (var i = 0; i < this.columns.length; i++) {
    var col = this.columns[i];
    if (col.total) {
      var sum = 0;
      var valFn = col.totalValue || function(item) { return parseFloat(item[col.field]) || 0; };
      for (var r = 0; r < filtered.length; r++) {
        sum += valFn(filtered[r]);
      }
      totals[i] = sum;
    }
  }
  return totals;
};

ModernSheet.prototype.render = function() {
  this.table.style.fontSize = this.currentFontSize + 'px';
  this.buildHeader();

  var filtered = this.getFilteredData();
  this.tbody.innerHTML = '';
  this.tfoot.innerHTML = '';

  var activeFilters = Object.keys(this.columnFilters).length;
  if (activeFilters > 0) {
    this.filterInfo.style.display = 'inline';
    this.filterInfo.textContent = activeFilters + ' filter(s) active';
  } else {
    this.filterInfo.style.display = 'none';
  }

  if (!filtered.length) {
    var tr = document.createElement('tr');
    tr.className = 'empty-row';
    var visCount = 0;
    for (var i = 0; i < this.columns.length; i++) if (!this.hiddenColumns.has(i)) visCount++;
    var td = document.createElement('td');
    td.colSpan = visCount || 1;
    td.textContent = this.emptyMessage;
    tr.appendChild(td);
    this.tbody.appendChild(tr);
  } else {
    for (var r = 0; r < filtered.length; r++) {
      var item = filtered[r];
      var tr = document.createElement('tr');
      for (var i = 0; i < this.columns.length; i++) {
        if (this.hiddenColumns.has(i)) continue;
        var col = this.columns[i];
        var td = document.createElement('td');
        td.style.fontSize = this.currentFontSize + 'px';
        
        if (col.render) {
          var cellHtml = col.render(item, true, r);
          td.innerHTML = String(cellHtml).replace(/Br /g, appCurrencySymbol);
        } else {
          td.textContent = item[col.field] || '';
        }
        
        if (col.align) td.style.textAlign = col.align;
        if (i < this.frozenColumns) {
          td.classList.add('frozen');
          td.style.left = this.getFrozenLeft(i) + 'px';
        }
        tr.appendChild(td);
      }
      this.tbody.appendChild(tr);
    }

    var totals = this.computeTotals(filtered);
    if (Object.keys(totals).length > 0) {
      var totalRow = document.createElement('tr');
      totalRow.className = 'total-row';
      for (var j = 0; j < this.columns.length; j++) {
        if (this.hiddenColumns.has(j)) continue;
        var tdTotal = document.createElement('td');
        tdTotal.style.fontSize = this.currentFontSize + 'px';
        if (totals[j] !== undefined) {
          var col = this.columns[j];
          var formatted = col.totalFormat ? col.totalFormat(totals[j]) : totals[j].toFixed(2);
          tdTotal.innerHTML = '<strong>' + String(formatted).replace(/Br /g, appCurrencySymbol) + '</strong>';
          if (col.align) tdTotal.style.textAlign = col.align;
        }
        if (j < this.frozenColumns) {
          tdTotal.classList.add('frozen');
          tdTotal.style.left = this.getFrozenLeft(j) + 'px';
        }
        totalRow.appendChild(tdTotal);
      }
      this.tfoot.appendChild(totalRow);
    }
  }

  this.footer.textContent = filtered.length + ' row' + (filtered.length !== 1 ? 's' : '');
};

ModernSheet.prototype.toggleColumnMenu = function(e) {
  var self = this;
  this.columnMenu.innerHTML = '';
  this.columnMenu.style.display = 'block';
  var rect = this.container.getBoundingClientRect();
  this.columnMenu.style.position = 'fixed';
  this.columnMenu.style.top = (rect.top + 40) + 'px';
  this.columnMenu.style.left = (rect.left + 10) + 'px';

  for (var i = 0; i < this.columns.length; i++) {
    var col = this.columns[i];
    var div = document.createElement('div');
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !this.hiddenColumns.has(i);
    cb.style.marginRight = '8px';
    (function(idx) {
      cb.onchange = function() {
        if (this.checked) self.hiddenColumns.delete(idx);
        else self.hiddenColumns.add(idx);
        self.render();
      };
    })(i);
    div.appendChild(cb);
    div.appendChild(document.createTextNode(col.title || 'Column ' + i));
    this.columnMenu.appendChild(div);
  }
};

ModernSheet.prototype.showContextMenu = function(e) {
  e.preventDefault();
  var th = e.target.closest('th');
  if (!th) return;
  var self = this;
  this.contextMenu.innerHTML = '';
  this.contextMenu.style.display = 'block';
  this.contextMenu.style.top = e.pageY + 'px';
  this.contextMenu.style.left = e.pageX + 'px';

  var sortAsc = document.createElement('div');
  sortAsc.textContent = 'Sort A → Z';
  sortAsc.onclick = function() { self.sortCol = self.getColumnIndexFromTh(th); self.sortAsc = true; self.render(); self.contextMenu.style.display = 'none'; };
  this.contextMenu.appendChild(sortAsc);

  var sortDesc = document.createElement('div');
  sortDesc.textContent = 'Sort Z → A';
  sortDesc.onclick = function() { self.sortCol = self.getColumnIndexFromTh(th); self.sortAsc = false; self.render(); self.contextMenu.style.display = 'none'; };
  this.contextMenu.appendChild(sortDesc);

  var hide = document.createElement('div');
  hide.textContent = 'Hide Column';
  hide.onclick = function() { var idx = self.getColumnIndexFromTh(th); self.hiddenColumns.add(idx); self.render(); self.contextMenu.style.display = 'none'; };
  this.contextMenu.appendChild(hide);

  var showAll = document.createElement('div');
  showAll.textContent = 'Show All Columns';
  showAll.onclick = function() { self.hiddenColumns.clear(); self.render(); self.contextMenu.style.display = 'none'; };
  this.contextMenu.appendChild(showAll);
};

ModernSheet.prototype.exportXLSX = function() {
  try {
    var filtered = this.getFilteredData();
    var wsData = [];
    var headerRow = [];
    for (var i = 0; i < this.columns.length; i++) { if (!this.hiddenColumns.has(i)) headerRow.push(this.columns[i].title); }
    wsData.push(headerRow);
    for (var r = 0; r < filtered.length; r++) {
      var row = [];
      for (var i = 0; i < this.columns.length; i++) {
        if (this.hiddenColumns.has(i)) continue;
        var col = this.columns[i];
        var val = col.render ? col.render(filtered[r], false) : (filtered[r][col.field] || '');
        row.push(val);
      }
      wsData.push(row);
    }
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'export.xlsx');
  } catch(e) { alert('XLSX export failed.'); }
};

ModernSheet.prototype.setData = function(newData) {
  this.data = newData;
  this.columnFilters = {};
  this.render();
};