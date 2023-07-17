
interface AlertProps {
    type: 'success' | 'error' | 'warning';
    message: string;
  }

const Alert = ({ type, message }: AlertProps) => {
  let alertClasses = '';

  if (type === 'success') {
    alertClasses = 'bg-green-100 text-green-800';
  } else if (type === 'error') {
    alertClasses = 'bg-red-100 text-red-800';
  } else if (type === 'warning') {
    alertClasses = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <div className={`p-4 rounded ${alertClasses}`}>
      {message}
    </div>
  );
};

export default Alert;