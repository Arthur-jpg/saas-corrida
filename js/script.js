// FAQ Toggle
document.addEventListener('DOMContentLoaded', function() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      // Toggle active class on the question
      question.classList.toggle('active');
      
      // Toggle active class on the answer
      const answer = question.nextElementSibling;
      answer.classList.toggle('active');
    });
  });
});
