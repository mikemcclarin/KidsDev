extends Area2D
# Pit hazard - player falls and loses a life

func _ready():
	body_entered.connect(_on_body_entered)

func _on_body_entered(body):
	if body.is_in_group("player"):
		body.lose_life()
