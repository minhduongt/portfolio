import {
  Box,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react";

const steps = [
  { title: "Reso", description: "Intern" },
  { title: "BeanOi", description: "Front-end Developer" },
  { title: "Now", description: "Freelancer" },
];

function StepperHistory() {
  const { activeStep } = useSteps({
    index: 2,
    count: steps.length,
  });

  return (
    <Stepper index={activeStep}>
      {steps.map((step, index) => (
        <Step key={index}>
          <StepIndicator>
            <StepStatus
              complete={<StepIcon />}
              incomplete={<StepNumber />}
              active={<StepNumber />}
            />
          </StepIndicator>

          <Box flexShrink="0">
            <StepTitle sx={{ fontSize: "2rem" }}>{step.title}</StepTitle>
            <StepDescription sx={{ color: "white" }}>
              {step.description}
            </StepDescription>
          </Box>

          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  );
}

export default StepperHistory;
