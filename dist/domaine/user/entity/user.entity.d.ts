import { Hobby } from '../../hobby/entity/hobby.entity';
export declare class User {
    id: string;
    name: string | null;
    biography: string | null;
    nbFollowers: number | null;
    nbFollowing: number | null;
    hasInfo: boolean;
    hasProcess: boolean;
    followers: User[];
    followings: User[];
    hobbies: Hobby[];
}
