import { Game } from "src/database/entity/game.entity";
import { UserFollow } from "src/database/entity/user-follow.entity";
import { User } from "../../database/entity/user.entity";
import { FollowingUserDto } from "./FollowingUser.dto";

export class UserProfileDto {
	uid: number;
	nickname: string;
	profileUrl: string;
	ELO: number;
	followings: FollowingUserDto[];
	winGames: Game[];
	loseGames: Game[];
	tfaEnabled: boolean;


	static async fromUserEntity(user: User, userFollowList: UserFollow[]): Promise<UserProfileDto> {
		const userProfileDto = new UserProfileDto();
		userProfileDto.uid = user.uid;
		userProfileDto.nickname = user.nickname;
		userProfileDto.profileUrl = user.profileUrl;
		userProfileDto.tfaEnabled = user.twoFactorEnabled;
		userProfileDto.ELO = user.elo;
		const followingUserDtos = await Promise.all(userFollowList.map(async (userFollow) => {
			return await FollowingUserDto.mapUserFollowToFollowingUserDto(userFollow);
		}));
		userProfileDto.followings = followingUserDtos;
		return userProfileDto;
	}
}
