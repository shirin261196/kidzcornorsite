import React from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";

const Contact = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data) => {
    console.log("Form Data:", data);
    toast.success("Message sent successfully!");
    reset(); // Reset form after submission
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h2 className="text-center mb-4">Contact Us</h2>
          <Form onSubmit={handleSubmit(onSubmit)}>
            {/* Name Field */}
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && <p className="text-danger">{errors.name.message}</p>}
            </Form.Group>

            {/* Email Field */}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: "Enter a valid email",
                  },
                })}
              />
              {errors.email && <p className="text-danger">{errors.email.message}</p>}
            </Form.Group>

            {/* Message Field */}
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Your message..."
                {...register("message", { required: "Message cannot be empty" })}
              />
              {errors.message && <p className="text-danger">{errors.message.message}</p>}
            </Form.Group>

            {/* Submit Button */}
            <Button variant="primary" type="submit" className="w-100">
              Send Message
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact;
