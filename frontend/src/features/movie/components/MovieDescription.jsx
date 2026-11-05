import React from 'react';
export default function MovieDescription({ m, showFacts = true }) {
  return (
    <div className="cinema-description">
      <h3>Nội dung phim</h3>
      <p className="synopsis">{m.description || 'Nội dung đang cập nhật.'}</p>
      {showFacts && (
        <dl className="cinema-facts">
          <div>
            <dt>Thể loại</dt>
            <dd>{m.genres.join(', ') || 'Đang cập nhật'}</dd>
          </div>
          <div>
            <dt>Quốc gia</dt>
            <dd>{m.country || 'Đang cập nhật'}</dd>
          </div>
          <div>
            <dt>Đạo diễn</dt>
            <dd>{m.director || 'Đang cập nhật'}</dd>
          </div>
          <div>
            <dt>Diễn viên</dt>
            <dd>{m.cast || 'Đang cập nhật'}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
