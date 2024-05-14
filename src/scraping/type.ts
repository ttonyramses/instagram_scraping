interface User {
    pk: string;
    pk_id: string;
    id: string;
    username: string;
    full_name: string;
    is_private: boolean;
    fbid_v2: string;
    third_party_downloads_enabled: number;
    strong_id__: string;
    profile_pic_id?: string;
    profile_pic_url: string;
    is_verified: boolean;
    has_anonymous_profile_picture: boolean;
    account_badges: any[]; // Remplacer 'any[]' par le type approprié si possible
    latest_reel_media: number;
  }
  
  export interface UserListResponse {
    big_list: boolean;
    page_size: number;
    next_max_id: string | null;
    has_more: boolean;
    should_limit_list_of_followers: boolean;
    use_clickable_see_more: boolean;
    show_spam_follow_request_tab: boolean;
    status: string;
    users: User[];
  }

  export enum Follow {
    FOLLOWER,
    FOLLOWING,
  }