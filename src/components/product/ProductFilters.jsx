import React from "react";
export default function ProductFilters({ onChange }) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onChange?.(Object.fromEntries(formData.entries()));
  }

  return (
    <form className="filters-panel panel" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="category">Category</label>
        <select className="select" id="category" name="category">
          <option value="">All categories</option>
          <option value="smart-devices">Smart devices</option>
          <option value="audio">Audio and sound</option>
          <option value="wearables">Wearables</option>
          <option value="home-office">Home office</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="sort">Sort by</label>
        <select className="select" id="sort" name="sort">
          <option value="popular">Most popular</option>
          <option value="newest">Newest arrivals</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <button className="primary-button" type="submit">Apply filters</button>
    </form>
  );
}
