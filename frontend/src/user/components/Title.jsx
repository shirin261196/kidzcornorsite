import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
`;

const Text = styled.p`
  color: #6b7280; /* Gray */
  font-weight: 500;
  span {
    font-weight: normal;
  }
`;

const Line = styled.div`
  width: 32px;
  height: 1px;
  background-color: #374151; /* Darker Gray */
  
  @media (min-width: 640px) {
    width: 48px;
    height: 2px;
  }
`;

const Title = ({ text1, text2 }) => {
  return (
    <Container>
      <Text>
        {text1}
        <span>{text2}</span>
      </Text>
      <Line />
    </Container>
  );
};

export default Title;
