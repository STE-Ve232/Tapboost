import React from 'react';
import { useUser } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface UserProfileProps {
	className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
	const { userData, loading, error } = useUser();
	const defaultAvatar = 'https://via.placeholder.com/150';

	return (
		<div className={cn("flex items-center space-x-4 p-4 border rounded-lg shadow-sm", className)}>
			{loading ? (
				<>
					<Skeleton className="w-16 h-16 rounded-full" />
					<div className="flex flex-col space-y-2">
						<Skeleton className="w-32 h-6" />
						<Skeleton className="w-24 h-4" />
					</div>
				</>
			) : error ? (
				<div className="text-red-500">Error: {error.message}</div>
			) : userData ? (
				<>
					<img
						src={userData.avatarUrl || defaultAvatar}
						alt={`${userData.username}'s avatar`}
						className="w-16 h-16 rounded-full object-cover"
					/>
					<div className="flex flex-col">
						<h2 className="text-xl font-semibold">{userData.username}</h2>
						<p className="text-gray-600">Points: {userData.points}</p>
					</div>
				</>
			) : (
				<>
				<Skeleton className="w-16 h-16 rounded-full" />
				<div className="flex flex-col space-y-2">
					<Skeleton className="w-32 h-6" />
					<Skeleton className="w-24 h-4" />
				</div>
			</>
			)}
			</div>
	);
};

export default UserProfile;