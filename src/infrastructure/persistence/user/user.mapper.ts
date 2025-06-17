import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/user/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class UserMapper {
  toDomain(ormEntity: UserOrmEntity): User {
    return User.create(ormEntity.id, {
      name: ormEntity.name,
      biography: ormEntity.biography,
      json: ormEntity.json,
      nbFollowers: ormEntity.nbFollowers,
      nbFollowings: ormEntity.nbFollowings,
      nbPublications: ormEntity.nbPublications,
      instagramId: ormEntity.instagramId,
      facebookId: ormEntity.facebookId,
      category: ormEntity.category,
      externalUrl: ormEntity.externalUrl,
      profileUrl: ormEntity.profileUrl,
      hasInfo: ormEntity.hasInfo,
      hasFollowerProcess: ormEntity.hasFollowerProcess,
      hasFollowingProcess: ormEntity.hasFollowingProcess,
      enable: ormEntity.enable,
      maxIdFollower: ormEntity.maxIdFollower,
      maxIdFollowing: ormEntity.maxIdFollowing,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  toOrm(user: User): Partial<UserOrmEntity> {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = user.id;
    ormEntity.name = user.name;
    ormEntity.biography = user.biography;
    ormEntity.json = user.json;
    ormEntity.nbFollowers = user.nbFollowers;
    ormEntity.nbFollowings = user.nbFollowings;
    ormEntity.nbPublications = user.nbPublications;
    ormEntity.instagramId = user.instagramId;
    ormEntity.facebookId = user.facebookId;
    ormEntity.category = user.category;
    ormEntity.externalUrl = user.externalUrl;
    ormEntity.profileUrl = user.profileUrl;
    ormEntity.hasInfo = user.hasInfo;
    ormEntity.hasFollowerProcess = user.hasFollowerProcess;
    ormEntity.hasFollowingProcess = user.hasFollowingProcess;
    ormEntity.enable = user.enable;
    ormEntity.maxIdFollower = user.maxIdFollower;
    ormEntity.maxIdFollowing = user.maxIdFollowing;
    ormEntity.createdAt = user.createdAt;
    ormEntity.updatedAt = user.updatedAt;

    return ormEntity;
  }
}
