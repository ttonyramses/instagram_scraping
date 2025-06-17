import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/user/entities/user.entity';
import { CreateUserDto } from './create-user.dto';
import { UserDto } from './user.dto';

@Injectable()
export class UserDtoMapper {
  toDomain(createUserDto: CreateUserDto): User {
    return User.create(createUserDto.id, {
      name: createUserDto.name,
      biography: createUserDto.biography,
      json: createUserDto.json,
      nbFollowers: createUserDto.nbFollowers,
      nbFollowings: createUserDto.nbFollowings,
      nbPublications: createUserDto.nbPublications,
      instagramId: createUserDto.instagramId,
      facebookId: createUserDto.facebookId,
      category: createUserDto.category,
      externalUrl: createUserDto.externalUrl,
      profileUrl: createUserDto.profileUrl,
      hasInfo: createUserDto.hasInfo,
      hasFollowerProcess: createUserDto.hasFollowerProcess,
      hasFollowingProcess: createUserDto.hasFollowingProcess,
      enable: createUserDto.enable,
      maxIdFollower: createUserDto.maxIdFollower,
      maxIdFollowing: createUserDto.maxIdFollowing,
    });
  }

  toDto(user: User): Partial<UserDto> {
    const userDto = new UserDto();
    userDto.id = user.id;
    userDto.name = user.name;
    userDto.biography = user.biography;
    userDto.json = user.json;
    userDto.nbFollowers = user.nbFollowers;
    userDto.nbFollowings = user.nbFollowings;
    userDto.nbPublications = user.nbPublications;
    userDto.instagramId = user.instagramId;
    userDto.facebookId = user.facebookId;
    userDto.category = user.category;
    userDto.externalUrl = user.externalUrl;
    userDto.profileUrl = user.profileUrl;
    userDto.hasInfo = user.hasInfo;
    userDto.hasFollowerProcess = user.hasFollowerProcess;
    userDto.hasFollowingProcess = user.hasFollowingProcess;
    userDto.enable = user.enable;
    userDto.maxIdFollower = user.maxIdFollower;
    userDto.maxIdFollowing = user.maxIdFollowing;
    userDto.createAt = user.createdAt;
    userDto.updateAt = user.updatedAt;

    return userDto;
  }
}
