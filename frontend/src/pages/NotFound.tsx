import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h1 className="text-9xl font-bold text-blue-600">404</h1>
                <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Page not found</h2>
                <p className="mt-2 text-base text-gray-500">
                    Sorry, we couldn't find the page you're looking for.
                </p>
                <div className="mt-6">
                    <Link
                        to="/"
                        className="text-base font-medium text-blue-600 hover:text-blue-500"
                    >
                        Go back home<span aria-hidden="true"> &rarr;</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
