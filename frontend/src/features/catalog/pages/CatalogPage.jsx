import DiscoverHero from '../components/DiscoverHero.jsx';
import { useCatalog } from '../hooks/useCatalog.js';
import CatalogMovieCard from '../components/CatalogMovieCard.jsx';
import CatalogFilters from '../components/CatalogFilters.jsx';
import CatalogToolbar from '../components/CatalogToolbar.jsx';
import React from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';

import '../styles/catalog.css';
export default function KkphimCatalog({ requestedType = 'all', requestedQuery = '', onOpenMovie }) {
  const {
    draft,
    setDraft,
    q,
    setQ,
    type,
    setType,
    page,
    category,
    country,
    year,
    sort,
    options,
    optionError,
    data,
    loading,
    error,
    setRetry,
    filter,
    setCategory,
    setCountry,
    setYear,
    setSort,
    reset,
    open,
    heroes,
    changePage,
  } = useCatalog(requestedType, requestedQuery, onOpenMovie);
  return (
    <>
      <DiscoverHero movies={heroes} q={q} open={open} paused={loading} />
      <section className="browse-catalog" id="browse-catalog">
        <div className="browse-heading">
          <div>
            <span className="section-kicker">KHÁM PHÁ KHO PHIM</span>
            <h2>
              {q
                ? 'Kết quả tìm kiếm'
                : type === 'phim-le'
                  ? 'Phim lẻ'
                  : type === 'phim-bo'
                    ? 'Phim bộ'
                    : type === 'hoat-hinh'
                      ? 'Thế giới hoạt hình'
                      : 'Mới cập nhật'}
            </h2>
          </div>
          <span className="browse-total">
            {!loading && !error
              ? data.totalResults.toLocaleString('vi-VN') + ' phim'
              : 'Đang tìm câu chuyện tiếp theo…'}
          </span>
        </div>
        <CatalogToolbar
          type={type}
          filter={filter}
          setType={setType}
          setQ={setQ}
          setDraft={setDraft}
          draft={draft}
          setRetry={setRetry}
          open={open}
        />
        <CatalogFilters
          category={category}
          country={country}
          year={year}
          sort={sort}
          options={options}
          filter={filter}
          setCategory={setCategory}
          setCountry={setCountry}
          setYear={setYear}
          setSort={setSort}
          reset={reset}
        />
        {optionError && (
          <p className="error">
            Không tải được bộ lọc: {optionError}{' '}
            <button className="text-button" onClick={() => setRetry((v) => v + 1)}>
              Thử lại
            </button>
          </p>
        )}
        {loading ? (
          <div className="browse-grid skeleton-grid" aria-label="Đang tải phim" role="status">
            {Array.from({ length: 12 }, (_, i) => (
              <div className="skeleton-card" key={i}>
                <i />
                <b />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty">
            <h3>Chưa tải được danh mục</h3>
            <p role="alert">{error}</p>
            <button className="primary" onClick={() => setRetry((v) => v + 1)}>
              Thử lại
            </button>
          </div>
        ) : data.results.length ? (
          <>
            <div className="browse-grid">
              {data.results.map((m) => (
                <CatalogMovieCard key={m.id} m={m} open={open} />
              ))}
            </div>
            <div className="catalog-pagination">
              <button
                className="secondary"
                disabled={page <= 1}
                onClick={() => changePage(page - 1)}
              >
                <ArrowLeft size={15} />
                Trước
              </button>
              <span>
                Trang <b>{page}</b> / {data.totalPages}
              </span>
              <button
                className="secondary"
                disabled={page >= data.totalPages}
                onClick={() => changePage(page + 1)}
              >
                Tiếp
                <ArrowRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty">
            <Search size={32} />
            <h3>Không tìm thấy phim phù hợp</h3>
            <p>Thử từ khóa khác hoặc nới rộng bộ lọc.</p>
            <button className="secondary" onClick={reset}>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </section>
    </>
  );
}
