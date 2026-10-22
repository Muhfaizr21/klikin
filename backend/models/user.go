package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserRole string

const (
	RoleSuperAdmin   UserRole = "SUPER_ADMIN"
	RoleAccountOwner UserRole = "ACCOUNT_OWNER"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	FullName  string    `gorm:"type:varchar(128)" json:"full_name"`
	Password  string    `gorm:"not null" json:"-"`
	Role      UserRole  `gorm:"type:varchar(32);default:'ACCOUNT_OWNER'" json:"role"`
	IsPro     bool      `gorm:"default:false" json:"is_pro"`
	AvatarURL         string     `gorm:"type:text" json:"avatar_url"`
	PhoneNumber       string     `gorm:"type:varchar(32)" json:"phone_number"`
	Bio               string     `gorm:"type:varchar(255)" json:"bio"`
	Website           string     `gorm:"type:varchar(255)" json:"website"`
	Timezone          string     `gorm:"type:varchar(64);default:'Asia/Jakarta'" json:"timezone"`
	Language          string     `gorm:"type:varchar(10);default:'id'" json:"language"`
	TwoFactorEnabled  bool       `gorm:"default:false" json:"two_factor_enabled"`
	PasswordChangedAt *time.Time `json:"password_changed_at,omitempty"`
	Pages             []BioPage  `gorm:"foreignKey:UserID" json:"pages,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// HashPassword hashes a raw password using bcrypt
func (u *User) HashPassword(plainPassword string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// CheckPassword compares a plaintext password with the hashed password
func (u *User) CheckPassword(plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plainPassword))
	return err == nil
}
