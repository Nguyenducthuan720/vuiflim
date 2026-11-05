import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
export default function CatalogFilters({
  category,
  country,
  year,
  sort,
  options,
  filter,
  setCategory,
  setCountry,
  setYear,
  setSort,
  reset,
}) {
  return (
    <div className="browse-filters">
      <span>
        <SlidersHorizontal size={15} />
        Bộ lọc
      </span>
      <select
        aria-label="Thể loại"
        value={category}
        onChange={(e) => filter(setCategory, e.target.value)}
      >
        <option value="">Mọi thể loại</option>
        {options.genres.map((g) => (
          <option key={g.slug} value={g.slug}>
            {g.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Quốc gia"
        value={country}
        onChange={(e) => filter(setCountry, e.target.value)}
      >
        <option value="">Mọi quốc gia</option>
        {options.countries.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Năm phát hành"
        value={year}
        onChange={(e) => filter(setYear, e.target.value)}
      >
        <option value="">Mọi năm</option>
        {Array.from(
          { length: new Date().getFullYear() - 1949 },
          (_, i) => new Date().getFullYear() - i,
        ).map((y) => (
          <option key={y}>{y}</option>
        ))}
      </select>
      <select aria-label="Sắp xếp" value={sort} onChange={(e) => filter(setSort, e.target.value)}>
        <option value="modified.time">Cập nhật mới nhất</option>
        <option value="year">Năm mới nhất</option>
        <option value="_id">Thứ tự danh mục</option>
      </select>
      <button className="reset-filters" onClick={reset}>
        <RotateCcw size={13} />
        Đặt lại
      </button>
    </div>
  );
}
