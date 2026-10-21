package models

import "time"

type UserRole string

const (
	RoleSuperAdmin   UserRole = "SUPER_ADMIN"
	RoleAccountOwner UserRole = "ACCOUNT_OWNER"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	Role      UserRole  `gorm:"default:'ACCOUNT_OWNER'" json:"role"`
	IsPro     bool      `gorm:"default:false" json:"is_pro"`
	Pages     []BioPage `gorm:"foreignKey:UserID" json:"pages,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
