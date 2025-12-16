import { logout } from '@/lib/helpers/server-side-auth';
import { Button } from '@/components/ui/button';

export function ServerLogoutButton() {
    return (
        <form action={logout}>
            <Button type="submit">
                Logout
            </Button>
        </form>
    );
}

