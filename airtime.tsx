// airtime.tsx
import React, { useState } from 'react';
import Tooltip from 'components/Tooltip';
import Modal from 'components/Modal';

const AirtimeComponent = () => {
    const [formData, setFormData] = useState({ phone: '', amount: '' });
    const [errors, setErrors] = useState({ phone: '', amount: '' });
    const [showModal, setShowModal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateInput(name, value);
    };

    const validateInput = (name, value) => {
        let error = '';
        if (name === 'phone') {
            const phoneRegex = /^[0-9]{10}$/;
            error = phoneRegex.test(value) ? '' : 'Enter a valid 10-digit phone number';
        } else if (name === 'amount') {
            error = value > 0 ? '' : 'Amount must be greater than zero';
        }
        setErrors({ ...errors, [name]: error });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!errors.phone && !errors.amount) {
            setShowModal(true);
        }
    };

    const confirmSubmit = () => {
        // Logic to handle successful submission
        alert('Airtime purchase confirmed!');
        setShowModal(false);
    };

    return (
        <div>
            <form onSubmit={handleSubmit} aria-label="Airtime Purchase Form">
                <div>
                    <label htmlFor="phone">Phone Number</label>
                    <Tooltip text="Enter your phone number (10 digits)"><input type="text" name="phone" value={formData.phone} onChange={handleChange} aria-invalid={!!errors.phone} /></Tooltip>
                    <span role="alert" aria-live="assertive">{errors.phone}</span>
                </div>
                <div>
                    <label htmlFor="amount">Amount</label>
                    <Tooltip text="Enter the amount for airtime"><input type="number" name="amount" value={formData.amount} onChange={handleChange} aria-invalid={!!errors.amount} /></Tooltip>
                    <span role="alert" aria-live="assertive">{errors.amount}</span>
                </div>
                <button type="submit">Purchase</button>
            </form>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <p>Are you sure you want to purchase airtime for {formData.phone}?</p>
                    <button onClick={confirmSubmit}>Yes</button>
                    <button onClick={() => setShowModal(false)}>No</button>
                </Modal>
            )}
        </div>
    );
};

export default AirtimeComponent;