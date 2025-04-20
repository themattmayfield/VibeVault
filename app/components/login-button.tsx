import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';

const LoginButton = () => {
  return (
    <Link to="/sign-in">
      <Button className="cursor-pointer">Sign in</Button>
    </Link>
  );
};

export default LoginButton;
