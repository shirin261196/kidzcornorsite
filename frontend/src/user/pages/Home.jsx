import React from 'react';
import Hero from '../components/Hero';
import LatestColection from '../components/LatestColection';
import BestSeller from '../components/BestSeller';
import OurPolicy from '../components/OurPolicy';
import TopTen from '../components/topTen';

const Home = () => {
  // Sample data (replace this with actual data from your API or state)
  const latestCollectionData = Array(50).fill('Latest Collection Item'); // Example data
  const bestSellerData = Array(50).fill('Best Seller Item'); // Example data

  return (
    <div className="container mt-4">
      <Hero />
      <div className="mb-5">
        <LatestColection items={latestCollectionData} />
      </div>
      <div className="mb-5">
        <BestSeller items={bestSellerData} />
      </div>
      <div className="mb-5">
        <TopTen />
      </div>
      <OurPolicy />
    </div>
  );
};

export default Home;
