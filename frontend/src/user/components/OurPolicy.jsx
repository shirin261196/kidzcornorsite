import React from 'react';
import { assets } from '../../assets/assets';

const OurPolicy = () => {
  return (
    <div className="container py-5">
      <div className="row text-center justify-content-center">
        <div className="col-12 col-sm-6 col-md-4 mb-4">
          <img src={assets.exchange_icon} className="mb-3" width="48" alt="Easy Exchange" />
          <p className="fw-semibold">Easy Exchange Policy</p>
          <p className="text-muted" style={{ fontSize: '13px' }}>We offer a hassle-free exchange policy</p>
        </div>
        <div className="col-12 col-sm-6 col-md-4 mb-4">
          <img src={assets.quality_icon} className="mb-3" width="48" alt="7 Days Return" />
          <p className="fw-semibold">7 Days Return Policy</p>
          <p className="text-muted" style={{ fontSize: '13px' }}>We provide a 7-day free return policy</p>
        </div>
        <div className="col-12 col-sm-6 col-md-4 mb-4">
          <img src={assets.support_img} className="mb-3" width="48" alt="Customer Support" />
          <p className="fw-semibold">Best Customer Support</p>
          <p className="text-muted" style={{ fontSize: '13px' }}>We provide 24/7 customer support</p>
        </div>
      </div>
    </div>
  );
};

export default OurPolicy;
