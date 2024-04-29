import { User } from '../../user/entity/user.entity';
import { Hobby } from '../../hobby/entity/hobby.entity';
export declare class weighting {
    id: number;
    hobby: Hobby;
    user: User;
    score: number;
}
